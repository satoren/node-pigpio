import { Pigpio, defaultFactory } from '@node-pigpio/highlevel'
import { TypedEventTarget } from '@node-pigpio/util'

export interface Button extends TypedEventTarget<{pressed: unknown, released: unknown}> {
    waitForPress(timeout?: number): Promise<boolean>
    waitForRelease(timeout?: number): Promise<boolean>
    close(): Promise<void>
    readonly pin: number
}

export const Button = async (pin: number, pullUp = true, gpio?: Pigpio): Promise<Button> => {
    gpio = gpio ?? await defaultFactory.get()
    const p = gpio.gpio(pin)
    await p.setMode('INPUT')

    const releaseEdge = pullUp ? 'risingEdge' : 'fallingEdge'
    const pressEdge = pullUp ? 'fallingEdge' : 'risingEdge'

    return new class implements Button {
        waitForPress (timeout?: number): Promise<boolean> {
            return p.waitForEdge(pressEdge, timeout)
        }

        waitForRelease (timeout?: number): Promise<boolean> {
            return p.waitForEdge(releaseEdge, timeout)
        }

        close (): Promise<void> {
            return p.close()
        }

        pin = pin

        addListener (event: 'pressed' | 'released', listener: (args: unknown) => void): this {
            const e = event === 'pressed' ? pressEdge : releaseEdge
            p.addListener(e, listener)
            return this
        }

        on (event: 'pressed' | 'released', listener: (args: unknown) => void): this {
            const e = event === 'pressed' ? pressEdge : releaseEdge
            p.on(e, listener)
            return this
        }

        once (event: 'pressed' | 'released', listener: (args: unknown) => void): this {
            const e = event === 'pressed' ? pressEdge : releaseEdge
            p.once(e, listener)
            return this
        }

        removeListener (event: 'pressed' | 'released', listener: (args: unknown) => void): this {
            const e = event === 'pressed' ? pressEdge : releaseEdge
            p.removeListener(e, listener)
            return this
        }

        off (event: 'pressed' | 'released', listener: (args: unknown) => void): this {
            const e = event === 'pressed' ? pressEdge : releaseEdge
            p.off(e, listener)
            return this
        }
    }()
}
