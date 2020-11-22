import { pigpio as llpigpio, Event as PigpioCallback, EITHER_EDGE, RISING_EDGE, FALLING_EDGE } from '../lowlevel'

import {
    Gpio,
    GpioMode,
    GpioModeTuple,
    PullUpDownType,
    GpioEdgeEvent,
    GpioEventArgsType
} from '../types'
import { MonoTypedEventEmitter } from '../utils/TypedEventEmitter'

const PullUpDownTypeTuple = ['OFF', 'DOWN', 'UP'] as const

class Callbacks {
    private callbacks = new Map<(args: GpioEdgeEvent) => void, Map<number, PigpioCallback>>()
    put (edge: number, listener: (args: GpioEdgeEvent) => void, callback: PigpioCallback) {
        const l = this.callbacks.get(listener)
        if (l) {
            l.set(edge, callback)
        } else {
            this.callbacks.set(listener, new Map([[edge, callback]]))
        }
    }

    get (edge: number, listener: (args: GpioEdgeEvent) => void): PigpioCallback | undefined {
        return this.callbacks.get(listener)?.get(edge)
    }

    delete (edge: number, listener: (args: GpioEdgeEvent) => void): void {
        this.callbacks.get(listener)?.delete(edge)
    }
}

type EventHandlerType<E extends keyof GpioEventArgsType> = (args:GpioEventArgsType[E]) => void

class GpioImpl implements Gpio {
    private callbacks = new Callbacks()
    readonly closeEvent = new MonoTypedEventEmitter<void>()
    private gpio: number
    private pi: llpigpio
    constructor (
        gpio: number,
        pi: llpigpio
    ) {
        this.gpio = gpio
        this.pi = pi
    }

    addListener<E extends 'edge' | 'risingEdge' | 'fallingEdge' > (event: E, listener: (args: GpioEventArgsType[E]) => void): this {
        switch (event) {
            case 'edge':
                this.appendCallback(EITHER_EDGE, listener as EventHandlerType<'edge'>)
                return this
            case 'risingEdge':
                this.appendCallback(RISING_EDGE, listener as EventHandlerType<'risingEdge'>)
                return this
            case 'fallingEdge':
                this.appendCallback(FALLING_EDGE, listener as EventHandlerType<'fallingEdge'>)
                return this
        }
        return this
    }

    on<E extends 'edge' | 'risingEdge' | 'fallingEdge' > (event: E, listener: (args: GpioEventArgsType[E]) => void): this {
        return this.addListener(event, listener)
    }

    once<E extends 'edge' | 'risingEdge' | 'fallingEdge'> (event: E, listener: (args: GpioEventArgsType[E]) => void): this {
        switch (event) {
            case 'edge':
                this.appendCallback(EITHER_EDGE, listener as EventHandlerType<'edge'>, true)
                return this
            case 'risingEdge':
                this.appendCallback(RISING_EDGE, listener as EventHandlerType<'risingEdge'>, true)
                return this
            case 'fallingEdge':
                this.appendCallback(FALLING_EDGE, listener as EventHandlerType<'fallingEdge'>, true)
                return this
        }
        return this
    }

    removeListener<E extends 'edge' | 'risingEdge' | 'fallingEdge'> (event: E, listener: (args: GpioEventArgsType[E]) => void): this {
        switch (event) {
            case 'edge':
                this.removeCallback(EITHER_EDGE, listener as EventHandlerType<'edge'>)
                return this
            case 'risingEdge':
                this.removeCallback(RISING_EDGE, listener as EventHandlerType<'risingEdge'>)
                return this
            case 'fallingEdge':
                this.removeCallback(FALLING_EDGE, listener as EventHandlerType<'fallingEdge'>)
                return this
        }
        return this
    }

    off<E extends 'edge' | 'risingEdge' | 'fallingEdge'> (event: E, listener: (args: GpioEventArgsType[E]) => void): this {
        return this.removeListener(event, listener)
    }

    appendCallback (edge:0 | 1 | 2, listener: (args: GpioEdgeEvent) => void, once = false) {
        const c = this.pi.callback(this.gpio, edge, (_, level, tick) : void => {
            listener({ level, tick })
            if (once) { this.removeCallback(edge, listener) }
        })
        this.callbacks.put(edge, listener, c)
    }

    removeCallback (edge:0 | 1 | 2, listener: (args: GpioEdgeEvent) => void) {
        const c = this.callbacks.get(edge, listener)
        c?.cancel()
        this.callbacks.delete(edge, listener)
    }

    async setServoPulsewidth (pulsewidth: number): Promise<void> {
        await this.pi.set_servo_pulsewidth(this.gpio, pulsewidth)
    }

    async getServoPulsewidth (): Promise<number> {
        return await this.pi.get_servo_pulsewidth(this.gpio)
    }

    async setPWMFrequency (frequency: number): Promise<void> {
        await this.pi.set_PWM_frequency(this.gpio, frequency)
    }

    async getPWMFrequency (): Promise<number> {
        return await this.pi.get_PWM_frequency(this.gpio)
    }

    async setPWMDutycycle (dutycycle: number): Promise<void> {
        await this.pi.set_PWM_dutycycle(this.gpio, dutycycle)
    }

    async getPWMDutycycle (): Promise<number> {
        return await this.pi.get_PWM_dutycycle(this.gpio)
    }

    async setPWMRange (range: number): Promise<void> {
        await this.pi.set_PWM_range(this.gpio, range)
    }

    async getPWMRealRange (): Promise<number> {
        return await this.pi.get_PWM_real_range(this.gpio)
    }

    async getPWMRange (): Promise<number> {
        return await this.pi.get_PWM_range(this.gpio)
    }

    async setMode (modeName: GpioMode): Promise<void> {
        const mode = GpioModeTuple.findIndex((m) => m === modeName)
        if (mode < 0) {
            throw new Error('Invalid argument')
        }

        await this.pi.set_mode(this.gpio, mode)
    }

    async getMode (): Promise<GpioMode> {
        const res = await this.pi.get_mode(this.gpio)
        const mode = GpioModeTuple[res]
        if (mode) {
            return mode
        }
        throw new Error('Unknown mode error')
    }

    async setPullUpDown (pudName: PullUpDownType): Promise<void> {
        const pud = PullUpDownTypeTuple.findIndex((m) => m === pudName)
        if (pud < 0) {
            throw new Error('Invalid argument')
        }
        await this.pi.set_pull_up_down(this.gpio, pud)
    }

    async write (level: 0 | 1): Promise<void> {
        await this.pi.write(this.gpio, level)
    }

    async read (): Promise<0 | 1> {
        const res = await this.pi.read(this.gpio)
        if (res === 0 || res === 1) {
            return res
        }
        throw new Error('Unknown level error')
    }

    get pin (): number {
        return this.gpio
    }

    async close (): Promise<void> {
        await this.closeEvent.emit()
    }
}

export const createGpio = (
    gpio: number,
    pi: llpigpio
): Gpio => new GpioImpl(gpio, pi)

export default { createGpio }
