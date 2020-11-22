
import { Pigpio } from '../../index'
import pigpioFactory from '../pigpioFactory'
import { AsyncTaskScheduler, CancelableTask, Sleepable, CanceledError } from '../utils/AsyncTask'

interface BlinkOption {
    onTime?: number
    offTime?: number
    repeat?: number;
}
export interface LED {
    on(): Promise<void>
    off(): Promise<void>
    toggle(): Promise<void>
    isLit(): Promise<boolean>
    setValue(value: number): Promise<void>
    getValue(): Promise<number>
    blink(param:BlinkOption): Promise<void>
    close(): void
    readonly pin: number
}

export const LED = async (pin: number, activeHigh = true, initialValue = false, gpio: Pigpio | undefined = undefined): Promise<LED> => {
    gpio = gpio ?? await pigpioFactory.get()
    const p = gpio.gpio(pin)
    await p.setMode('OUTPUT')

    const on = async (): Promise<void> => {
        await p.write(activeHigh ? 1 : 0)
    }
    const off = async (): Promise<void> => {
        await p.write(activeHigh ? 0 : 1)
    }
    const isLit = async (): Promise<boolean> => {
        return (!!await p.read()) === activeHigh
    }

    const toggle = async (): Promise<void> => {
        if (await isLit()) {
            await off()
        } else {
            await on()
        }
    }

    const task = new AsyncTaskScheduler()

    const blink = async ({ onTime = 1000, offTime = 1000, repeat = Infinity }: BlinkOption): Promise<void> => {
        const blinkTask: CancelableTask = Sleepable((sleep): CancelableTask => () => {
            let cancel: ()=> void
            const promise = new Promise<void>((resolve, reject) => {
                let canceled = false
                cancel = () => {
                    canceled = true
                    reject(new CanceledError('canceled'))
                }
                (async () => {
                    try {
                        while (repeat > 0) {
                            if (canceled) { return }
                            await on()
                            await sleep(onTime)
                            await off()
                            await sleep(offTime)
                            repeat -= 1
                        }
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                })()
            })
            return { promise, cancel: () => cancel() }
        })

        await task.start(blinkTask)
    }

    const setValue = async (value: number): Promise<void> => {
        if (value < 0 || value > 1) {
            throw Error(`The value of "value" is out of range. It must be >= 0 and <= 1. Received ${value}`)
        }
        if (value === 1) {
            await on()
        } else {
            await off()
        }
    }
    const getValue = async (): Promise<number> => {
        return await isLit() ? 1 : 0
    }

    const close = () => {
        p.close()
    }

    const led: LED = {
        on, off, isLit, toggle, pin, setValue, getValue, blink, close
    }
    await led.setValue(initialValue ? 1 : 0)
    return led
}
