import { pigpio } from '@node-pigpio/highlevel'

const sleep = (sec: number) => {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000))
}

;(async () => {
  let gpio
  try {
    gpio = await pigpio()
    const servo1 = gpio.gpio(14)
    await servo1.setServoPulsewidth(1600)
    console.log(await servo1.getServoPulsewidth())
    await sleep(0.3)
    await servo1.setServoPulsewidth(1950)
    console.log(await servo1.getServoPulsewidth())
    await sleep(0.1)
    await servo1.setServoPulsewidth(1600)
    console.log(await servo1.getServoPulsewidth())
    await sleep(0.3)

    await servo1.setPWMFrequency(100)
    console.log(await servo1.getPWMFrequency())

    await servo1.setPWMDutycycle(101)
    console.log(await servo1.getPWMDutycycle())

    await servo1.setPWMRange(103)
    console.log(await servo1.getPWMRange())
    console.log(await servo1.getPWMRealRange())
    await servo1.setServoPulsewidth(1600)
  } catch (e) {
    console.log(e)
  } finally {
    await gpio?.close()
  }
})()
