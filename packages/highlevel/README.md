# `@node-pigpio/highlevel`

## Usage

```
import { outputDevices, usingAsync } from '@node-pigpio/devices'

import LED = outputDevices.LED
;(async () => {
  await usingAsync(await LED(22, false), async (led) => {
    await led.blink({ onTime: 1000, offTime: 1000, repeat: 5 })
  })
})()
```
