import { Pigpio, defaultFactory } from '@node-pigpio/highlevel'

export interface Button {
    waitForPress(timeout?: number): Promise<boolean>
    waitForRelease(timeout?: number): Promise<boolean>
    close(): Promise<void>
    readonly pin: number
}

export const Button = async (pin: number, gpio: Pigpio | undefined = undefined): Promise<Button> => {
    gpio = gpio ?? await defaultFactory.get()
    const p = gpio.gpio(pin)
    await p.setMode('INPUT')

    const waitForPress = async (timeout?: number) => {
        return p.waitForEdge('risingEdge', timeout)
    }
    const waitForRelease = async (timeout?: number) => {
        return p.waitForEdge('fallingEdge', timeout)
    }

    return {
        waitForPress,
        waitForRelease,
        close: () => p.close(),
        pin
    }
}
