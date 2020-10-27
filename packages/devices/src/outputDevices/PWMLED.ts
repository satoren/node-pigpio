import { LED } from './LED'

import { Pigpio, defaultFactory } from '@node-pigpio/highlevel'

import { AsyncTaskScheduler, CancelableTask, Sleepable, CanceledError } from '@node-pigpio/util'

interface BlinkOption {
    onTime?: number
    offTime?: number
    fadeInTime?: number
    fadeOutTime?: number
    repeat?: number
}
interface PulseOption {
    fadeInTime?: number
    fadeOutTime?: number
    repeat?: number
}

export interface PWMLED extends LED {
    blink(param: BlinkOption): Promise<void>
    pulse(param: PulseOption): Promise<void>
    setFrequency(frequency: number): Promise<void>
    getFrequency(): Promise<number>
}

const lerp = (from: number, to: number, per: number) => {
    return (to - from) * per + from
}
const buildSequence = ({ onTime, offTime, fadeInTime, fadeOutTime, fps = 30 }: Required<BlinkOption> & { fps?: number }): {value: number, delay: number}[] => {
    const sequence:{value: number, delay: number}[] = []
    if (fadeInTime > 0) {
        const fadein = fadeInTime * fps / 1000
        for (let i = 0; i < fadein; i += 1) {
            sequence.push({ value: lerp(0, 1, i / fadein), delay: 1000 / fps })
        }
    }
    if (onTime > 0) {
        sequence.push({ value: 1, delay: onTime })
    }
    if (fadeOutTime > 0) {
        const fadein = fadeOutTime * fps / 1000
        for (let i = 0; i < fadein; i += 1) {
            sequence.push({ value: lerp(1, 0, i / fadein), delay: 1000 / fps })
        }
    }
    if (offTime > 0) {
        sequence.push({ value: 0, delay: offTime })
    }
    return sequence
}

const range = 100
export const PWMLED = async (pin: number, activeHigh = true, initialValue = 0, frequency = 100, gpio: Pigpio | undefined = undefined): Promise<PWMLED> => {
    gpio = gpio ?? await defaultFactory.get()
    const p = gpio.gpio(pin)

    const toCycle = (value: number): number => {
        return activeHigh ? (value * range) : (1 - value) * range
    }
    const toValue = (value: number): number => {
        return activeHigh ? (value / range) : 1 - (value / range)
    }

    const setValue = async (value: number): Promise<void> => {
        if (value < 0 || value > 1) {
            throw Error(`The value of "value" is out of range. It must be >= 0 and <= 1. Received ${value}`)
        }
        await p.setPWMDutycycle(toCycle(value))
    }
    const getValue = async (): Promise<number> => {
        return toValue(await p.getPWMDutycycle())
    }

    const isLit = async (): Promise<boolean> => {
        return await getValue() > 0
    }

    const on = async (): Promise<void> => {
        await setValue(1)
    }
    const off = async (): Promise<void> => {
        await setValue(0)
    }
    const toggle = async (): Promise<void> => {
        const v = await getValue()
        await setValue(1 - v)
    }
    const task = new AsyncTaskScheduler()
    const blink = async ({ onTime = 1000, offTime = 1000, fadeInTime = 0, fadeOutTime = 0, repeat = Infinity }: BlinkOption): Promise<void> => {
        const blinkTask: CancelableTask = Sleepable((sleep): CancelableTask => () => {
            let cancel: ()=> void
            const promise = new Promise<void>((resolve, reject) => {
                let canceled = false
                cancel = () => {
                    canceled = true
                    reject(new CanceledError('canceled'))
                }
                (async ():Promise<void> => {
                    try {
                        const sequence = buildSequence({ onTime, offTime, fadeInTime, fadeOutTime, repeat })
                        while (repeat > 0) {
                            for (const seq of sequence) {
                                await setValue(seq.value)
                                if (canceled) { return }
                                await sleep(onTime)
                                if (canceled) { return }
                            }
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

    const pulse = async (option : PulseOption) => await blink({ ...option, onTime: 0, offTime: 0 })

    const setFrequency = async (freq: number): Promise<void> => {
        await p.setPWMFrequency(freq)
    }
    const getFrequency = async (): Promise<number> => {
        return await p.getPWMFrequency()
    }

    const close = () => {
        p.close()
    }

    await p.setMode('OUTPUT')
    await setFrequency(frequency)
    await p.setPWMRange(range)
    await setValue(initialValue)

    const pwmled: PWMLED = {
        on,
        off,
        setValue,
        getValue,
        pulse,
        blink,
        toggle,
        isLit,
        getFrequency,
        setFrequency,
        close,
        pin
    }
    return pwmled
}
