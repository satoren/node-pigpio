import { outputDevices, usingAsync } from '@node-pigpio/devices'

import RGBLED = outputDevices.RGBLED

const sleep = (msec: number) => {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

;(async () => {
  await usingAsync(
    await RGBLED(9, 10, 11, false, { r: 0, g: 0, b: 0 }),
    async (led) => {
      await led.pulse({
        fadeInTime: 1000,
        fadeOutTime: 1000,
        repeat: 1,
        offColor: { r: 1, g: 0, b: 0 },
        onColor: { r: 0, g: 1, b: 0 },
      })
      await led.pulse({
        fadeInTime: 1000,
        fadeOutTime: 1000,
        repeat: 1,
        offColor: { r: 0, g: 1, b: 0 },
        onColor: { r: 0, g: 0, b: 1 },
      })
      await led.pulse({
        fadeInTime: 1000,
        fadeOutTime: 1000,
        repeat: 1,
        offColor: { r: 0, g: 0, b: 1 },
        onColor: { r: 1, g: 0, b: 0 },
      })
      await led.setValue({ r: 1, g: 0, b: 0 })
      await sleep(2000)
      await led.setValue({ r: 0, g: 1, b: 0 })
      await sleep(2000)
      await led.setValue({ r: 0, g: 0, b: 1 })
      await sleep(2000)
      await led.on()
      await sleep(2000)
      await led.off()
      await sleep(2000)
    }
  )
})()
