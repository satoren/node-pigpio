# `@node-pigpio/core`

This is the same feature as the original [python library](http://abyz.me.uk/rpi/pigpio/python.html) except that all requests are asynchronous.

## Usage

```ts
import * as pigpio from '@node-pigpio/core'
(async ()={
    const pi1 = await pigpio.pi()       // pi1 accesses the local Pi's GPIO
    const pi2 = await pigpio.pi('tom')  // pi2 accesses tom's GPIO
    const pi3 = await pigpio.pi('dick') // pi3 accesses dick's GPIO

    await pi1.write(4, 0) // set local Pi's GPIO 4 low
    await pi2.write(4, 1) // set tom's GPIO 4 to high
    await pi3.read(4)     // get level of dick's GPIO 4
})()
```
