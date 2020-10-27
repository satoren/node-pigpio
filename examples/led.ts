import { devices } from 'node-pigpio-if'

import LED = devices.outputDevices.LED
import usingAsync = devices.utils.usingAsync

(async () => {
    await usingAsync(await LED(22, false), async (led) => {
        await led.blink({ onTime: 1000, offTime: 1000, repeat: 5 })
    })
})()
