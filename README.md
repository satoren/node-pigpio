[![npm version](https://badge.fury.io/js/%40node-pigpio%2Fcore.svg)](https://badge.fury.io/js/%40node-pigpio%2Fcore)
![test](https://github.com/satoren/node-pigpio/workflows/test/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/satoren/node-pigpio/badge.svg?branch=main)](https://coveralls.io/github/satoren/node-pigpio?branch=main)

# @node-pigpio

pigpiod socket interface for node.js

## Features

- Can run gpio program on Windows/Mac/Linux with remote gpio by pigpiod
- high level wrappers api for for I2C, SPI, Bit banging I2C
- Contains a lowlevel api with the same features as the original [python library](http://abyz.me.uk/rpi/pigpio/python.html)

## Requirements

- Node 12.x or later
- install and run pigopid
  http://abyz.me.uk/rpi/pigpio/download.html

## Usage

```
npm install @node-pigpio/devices
```

```ts
import { outputDevices, usingAsync } from '@node-pigpio/devices'

import LED = outputDevices.LED
;(async () => {
  await usingAsync(await LED(22, false), async (led) => {
    await led.blink({ onTime: 1000, offTime: 1000, repeat: 5 })
  })
})()
```

### lowlevel api

```
npm install @node-pigpio/core
```

lowlevel API is the same feature as the original [python library](http://abyz.me.uk/rpi/pigpio/python.html) except that all requests are asynchronous.

```ts
import * as pigpio from '@node-pigpio/core'
;(async () => {
  const pi1 = await pigpio.pi() // pi1 accesses the local Pi's GPIO
  const pi2 = await pigpio.pi('tom') // pi2 accesses tom's GPIO
  const pi3 = await pigpio.pi('dick') // pi3 accesses dick's GPIO

  await pi1.write(4, 0) // set local Pi's GPIO 4 low
  await pi2.write(4, 1) // set tom's GPIO 4 to high
  await pi3.read(4) // get level of dick's GPIO 4
})()
```
