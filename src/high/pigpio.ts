import { pi, pigpio as llpigpio, Event as PigpioEvent } from '../lowlevel'

import {
    Gpio,
    I2c,
    Pigpio,
    EventName,
    EventNameTuple,
    GpioEvent,
    BBI2COption,
    I2COption,
    SpiOption,
    Spi,
    BBSpiOption
} from '../types'
import { createGpio } from './gpio'
import { I2cFactory, BBI2cFactory } from './i2c'
import { SpiFactory, BBSpiFactory } from './spi'
import { TypedEvent } from '../utils/TypedEventEmitter'

function isI2COption (option: unknown): option is I2COption {
    return (
        (option as I2COption).bus != null && (option as I2COption).address != null
    )
}
function isSpiOption (option: unknown): option is SpiOption {
    return (
        (option as SpiOption).channel != null && (option as SpiOption).baudRate != null
    )
}

class Events {
    private events = new Map<(args: GpioEvent) => void, Map<number, PigpioEvent>>()
    put (eventno: number, listener: (args: GpioEvent) => void, event: PigpioEvent) {
        const l = this.events.get(listener)
        if (l) {
            l.set(eventno, event)
        } else {
            this.events.set(listener, new Map([[eventno, event]]))
        }
    }

    get (eventno: number, listener: (args: GpioEvent) => void): PigpioEvent | undefined {
        return this.events.get(listener)?.get(eventno)
    }

    delete (eventno: number, listener: (args: GpioEvent) => void): void {
        this.events.get(listener)?.delete(eventno)
    }
}

class PigpioImpl implements Pigpio {
    private pi: llpigpio
    private spiFactory: SpiFactory
    private i2cFactory: I2cFactory
    private bbSpiFactory: BBSpiFactory
    private bbI2cFactory: BBI2cFactory
    private autoClose: boolean
    private users = new Set<unknown>()
    private isClosed = false
    private events = new Events()
    constructor (
        pi: llpigpio,
        autoClose: boolean
    ) {
        this.pi = pi
        this.spiFactory = new SpiFactory(pi)
        this.i2cFactory = new I2cFactory(pi)
        this.bbSpiFactory = new BBSpiFactory(pi)
        this.bbI2cFactory = new BBI2cFactory(pi)
        this.autoClose = autoClose
    }

    addListener (event: EventName, listener: (args: GpioEvent) => void): this {
        const ev = EventNameTuple.findIndex((n) => n === event)
        const e = this.pi.event_callback(ev, (_, tick) => {
            listener({ tick })
        })
        this.events.put(ev, listener, e)
        return this
    }

    on (name: EventName, handler: (event: GpioEvent) => void): this {
        return this.addListener(name, handler)
    }

    once (event: EventName, listener: (args: GpioEvent) => void): this {
        const ev = EventNameTuple.findIndex((n) => n === event)
        const e = this.pi.event_callback(ev, (_, tick) => {
            listener({ tick })
            e.cancel()
            this.events.delete(ev, listener)
        })
        this.events.put(ev, listener, e)
        return this
    }

    removeListener (event: EventName, listener: (args: GpioEvent) => void): this {
        const ev = EventNameTuple.findIndex((n) => n === event)
        const e = this.events.get(ev, listener)
        e?.cancel()
        this.events.delete(ev, listener)
        return this
    }

    off (event: EventName, listener: (args: GpioEvent) => void): this {
        return this.removeListener(event, listener)
    }

    gpio (no: number): Gpio {
        return this.autoCloseWrap(createGpio(no, this.pi))
    }

    async i2c (option: I2COption | BBI2COption): Promise<I2c> {
        if (isI2COption(option)) {
            const { bus, address, flags = 0 } = option
            return this.autoCloseWrap(await this.i2cFactory.create(bus, address, flags))
        }
        const {
            address, sda, scl, baudRate
        } = option
        return this.autoCloseWrap(await this.bbI2cFactory.create(
            address,
            sda,
            scl,
            baudRate
        ))
    }

    async spi (option: SpiOption | BBSpiOption): Promise<Spi> {
        if (isSpiOption(option)) {
            const { channel, baudRate, flags = 0 } = option
            return this.autoCloseWrap(await this.spiFactory.create(channel, baudRate, flags))
        }
        const {
            cs, miso, mosi, sclk, baudRate, flags = 0
        } = option
        return this.autoCloseWrap(await this.bbSpiFactory.create(
            cs,
            miso,
            mosi,
            sclk,
            baudRate,
            flags
        ))
    }

    async getCurrentTick (): Promise<number> {
        return await this.pi.get_current_tick()
    }

    async getHardwareRevision (): Promise<number> {
        return await this.pi.get_hardware_revision()
    }

    async eventTrigger (eventName: EventName): Promise<void> {
        const event = EventNameTuple.findIndex((n) => n === eventName)
        if (event < 0) {
            throw new Error('Invalid Event')
        }

        await this.pi.event_trigger(event)
    }

    async close (): Promise<void> {
        await this.spiFactory.close()
        await this.i2cFactory.close()
        await this.bbSpiFactory.close()
        await this.bbI2cFactory.close()
        await this.pi.stop()
        this.isClosed = true
    }

    autoCloseWrap<T extends TypedEvent<{close: void}>> (c: T): T {
        if (this.autoClose) {
            this.users.add(c)
            c.once('close', () => {
                this.users.delete(c)
                if (this.users.size === 0) {
                    void this.close()
                }
            })
        }
        return c
    }

    get closed (): boolean {
        return this.isClosed
    }
}

export const pigpio = async (host?: string, port?: number, autoClose?:boolean): Promise<Pigpio> => {
    return new PigpioImpl(await pi(host, port), !!autoClose)
}

export default { pigpio }
