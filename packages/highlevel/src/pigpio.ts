import * as llpigpio from '@node-pigpio/core'

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
} from './types'
import { createGpio } from './gpio'
import { I2cFactory, BBI2cFactory } from './i2c'
import { SpiFactory, BBSpiFactory } from './spi'
import { MonoTypedEventTarget, MonoTypedEventEmitter, TypedEventTarget } from '@node-pigpio/util'

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

type EventListener = (args: GpioEvent) => void
class EventImple implements TypedEventTarget<{ [K in EventName]: GpioEvent} > {
    private pi: llpigpio.pigpio
    private events = new Map<(args: GpioEvent) => void, Map<number, llpigpio.Event>>()
    private put (eventno: number, listener: EventListener, event: llpigpio.Event) {
        const l = this.events.get(listener)
        if (l) {
            l.set(eventno, event)
        } else {
            this.events.set(listener, new Map([[eventno, event]]))
        }
    }

    private get (eventno: number, listener: EventListener): llpigpio.Event | undefined {
        return this.events.get(listener)?.get(eventno)
    }

    private delete (eventno: number, listener: EventListener): void {
        this.events.get(listener)?.delete(eventno)
    }

    constructor (pi: llpigpio.pigpio) {
        this.pi = pi
    }

    addListener (event: EventName, listener: (args: GpioEvent) => void): this {
        const ev = EventNameTuple.findIndex((n) => n === event)
        const e = this.pi.event_callback(ev, (_, tick) => {
            listener({ tick })
        })
        this.put(ev, listener, e)
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
            this.delete(ev, listener)
        })
        this.put(ev, listener, e)
        return this
    }

    removeListener (event: EventName, listener: (args: GpioEvent) => void): this {
        const ev = EventNameTuple.findIndex((n) => n === event)
        const e = this.get(ev, listener)
        e?.cancel()
        this.delete(ev, listener)
        return this
    }

    off (event: EventName, listener: (args: GpioEvent) => void): this {
        return this.removeListener(event, listener)
    }
}

interface Closable {
    close: ()=> void | Promise<void>
}

class PigpioImpl implements Pigpio {
    private pi: llpigpio.pigpio
    private spiFactory: SpiFactory
    private i2cFactory: I2cFactory
    private bbSpiFactory: BBSpiFactory
    private bbI2cFactory: BBI2cFactory
    private autoClose: boolean
    private users = new Set<Closable>()
    private isClosed = false
    readonly event: EventImple
    readonly closeEvent = new MonoTypedEventEmitter<void>()
    constructor (
        pi: llpigpio.pigpio,
        autoClose: boolean
    ) {
        this.pi = pi
        this.event = new EventImple(pi)
        this.spiFactory = new SpiFactory(pi)
        this.i2cFactory = new I2cFactory(pi)
        this.bbSpiFactory = new BBSpiFactory(pi)
        this.bbI2cFactory = new BBI2cFactory(pi)
        this.autoClose = autoClose
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

    getCurrentTick (): Promise<number> {
        return this.pi.get_current_tick()
    }

    getHardwareRevision (): Promise<number> {
        return this.pi.get_hardware_revision()
    }

    getPigpioVersion (): Promise<number> {
        return this.pi.get_pigpio_version()
    }

    async eventTrigger (eventName: EventName): Promise<void> {
        const event = EventNameTuple.findIndex((n) => n === eventName)
        if (event < 0) {
            throw new Error('Invalid Event')
        }

        await this.pi.event_trigger(event)
    }

    async close (): Promise<void> {
        if (this.isClosed) { return }
        this.isClosed = true
        const children = Array.from(this.users.values()).map(user => user.close())
        this.users.clear()
        await Promise.all(children)
        await this.pi.stop()
        await this.closeEvent.emit()
    }

    autoCloseWrap<T extends {closeEvent: MonoTypedEventTarget<void>} & Closable> (c: T): T {
        this.users.add(c)
        c.closeEvent.once(async () => {
            if (this.users.has(c)) {
                this.users.delete(c)
                if (this.autoClose && this.users.size === 0) {
                    await this.close()
                }
            }
        })
        return c
    }
}

export const pigpio = async (host?: string, port?: number, autoClose?:boolean): Promise<Pigpio> => {
    return new PigpioImpl(await llpigpio.pi(host, port), !!autoClose)
}

export type { Pigpio }

export default { pigpio }
