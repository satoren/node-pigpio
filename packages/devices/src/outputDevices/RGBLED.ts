import { Pigpio } from '@node-pigpio/highlevel'
import { LED } from './LED'
import { PWMLED } from './PWMLED'
import {
  AsyncTaskScheduler,
  CancelableTask,
  Sleepable,
  CanceledError,
} from '@node-pigpio/util'

type Color = { r: number; g: number; b: number }

const colorValue = (color: Color, index: number) => {
  switch (index) {
    case 0:
      return color.r
    case 1:
      return color.g
    case 2:
      return color.b
  }
  return color.r
}

interface BlinkOption {
  onTime?: number
  offTime?: number
  fadeInTime?: number
  fadeOutTime?: number
  onColor?: Color
  offColor?: Color
  repeat?: number
}

const lerp = (from: number, to: number, per: number) => {
  return (to - from) * per + from
}

export const buildSequence = ({
  onTime,
  offTime,
  fadeInTime,
  fadeOutTime,
  onColor,
  offColor,
  fps = 30,
}: Required<BlinkOption> & { fps?: number }): {
  value: Color
  delay: number
}[] => {
  const sequence: { value: Color; delay: number }[] = []
  if (fadeInTime > 0) {
    const fadein = (fadeInTime * fps) / 1000
    for (let i = 0; i < fadein; i += 1) {
      const v = i / fadein
      sequence.push({
        value: {
          r: lerp(offColor.r, onColor.r, v),
          g: lerp(offColor.g, onColor.g, v),
          b: lerp(offColor.b, onColor.b, v),
        },
        delay: 1000 / fps,
      })
    }
  }
  if (onTime > 0) {
    sequence.push({ value: onColor, delay: onTime })
  }
  if (fadeOutTime > 0) {
    const fadein = (fadeOutTime * fps) / 1000
    for (let i = 0; i < fadein; i += 1) {
      const v = i / fadein
      sequence.push({
        value: {
          r: lerp(onColor.r, offColor.r, v),
          g: lerp(onColor.g, offColor.g, v),
          b: lerp(onColor.b, offColor.b, v),
        },
        delay: 1000 / fps,
      })
    }
  }
  if (offTime > 0) {
    sequence.push({ value: offColor, delay: offTime })
  }
  return sequence
}

interface PulseOption {
  fadeInTime?: number
  fadeOutTime?: number
  onColor?: Color
  offColor?: Color
  repeat?: number
}
interface RGBLED {
  on(): Promise<void>
  off(): Promise<void>
  toggle(): Promise<void>
  isLit(): Promise<boolean>
  setValue(value: Color): Promise<void>
  getValue(): Promise<Color>
  blink(param: BlinkOption): Promise<void>
  pulse(param: PulseOption): Promise<void>
  close(): void
  red: PWMLED | LED
  green: PWMLED | LED
  blue: PWMLED | LED
}

export const RGBLED = async (
  redPin: number,
  greenPin: number,
  bluePin: number,
  activeHigh = true,
  initialValue: Color = { r: 0, g: 0, b: 0 },
  pwm = true,
  gpio: Pigpio | undefined = undefined
): Promise<RGBLED> => {
  const components: (LED | PWMLED)[] = []
  for (const [pin, v] of [
    [redPin, initialValue.r],
    [greenPin, initialValue.g],
    [bluePin, initialValue.b],
  ]) {
    components.push(
      pwm
        ? await PWMLED(pin, activeHigh, v, undefined, gpio)
        : await LED(pin, activeHigh, v > 0, gpio)
    )
  }

  const on = async (): Promise<void> => {
    await Promise.all(components.map((c) => c.on()))
  }
  const off = async (): Promise<void> => {
    await Promise.all(components.map((c) => c.off()))
  }
  const toggle = async (): Promise<void> => {
    await Promise.all(components.map((c) => c.toggle()))
  }
  const isLit = async (): Promise<boolean> => {
    return (
      (await Promise.all(components.map((c) => c.isLit()))).find((v) => v) !=
      null
    )
  }

  const setValue = async (value: Color): Promise<void> => {
    await Promise.all(
      components.map((c, index) => c.setValue(colorValue(value, index)))
    )
  }
  const getValue = async (): Promise<Color> => {
    const color = await Promise.all(components.map((c) => c.getValue()))
    return { r: color[0], g: color[1], b: color[2] }
  }
  const task = new AsyncTaskScheduler()
  const blink = async ({
    onTime = 1000,
    offTime = 1000,
    fadeInTime = 0,
    fadeOutTime = 0,
    onColor = { r: 1, g: 1, b: 1 },
    offColor = { r: 0, g: 0, b: 0 },
    repeat = Infinity,
  }: BlinkOption): Promise<void> => {
    const blinkTask: CancelableTask = Sleepable(
      (sleep): CancelableTask => () => {
        let cancel: () => void
        const promise = new Promise<void>((resolve, reject) => {
          let canceled = false
          cancel = () => {
            canceled = true
            reject(new CanceledError('canceled'))
          }
          ;(async (): Promise<void> => {
            try {
              const sequence = buildSequence({
                onTime,
                offTime,
                fadeInTime,
                fadeOutTime,
                offColor,
                onColor,
                repeat,
              })
              while (repeat > 0) {
                for (const seq of sequence) {
                  await setValue(seq.value)
                  if (canceled) {
                    return
                  }
                  await sleep(onTime)
                  if (canceled) {
                    return
                  }
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
      }
    )

    await task.start(blinkTask)
  }

  const pulse = async (option: PulseOption) =>
    await blink({ ...option, onTime: 0, offTime: 0 })

  const close = async (): Promise<void> => {
    await Promise.all(components.map((c) => c.close()))
  }

  return {
    red: components[0],
    green: components[1],
    blue: components[2],
    on,
    off,
    toggle,
    setValue,
    getValue,
    isLit,
    blink,
    pulse,
    close,
  }
}

export default RGBLED
