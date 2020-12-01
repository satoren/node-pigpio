/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createGpio } from '@node-pigpio/highlevel/src/gpio'

import * as pigpio from '@node-pigpio/core'

jest.mock('@node-pigpio/core')

const asMock = (func: unknown): jest.Mock => {
  return func as jest.Mock
}

let mockedPigpio: pigpio.pigpio
beforeEach(async () => {
  mockedPigpio = await pigpio.pi()
  jest.clearAllMocks()
})
test('create', () => {
  const gpio = createGpio(3, mockedPigpio)
  expect(gpio.pin).toBe(3)
})
test('close', async () => {
  const gpio = createGpio(3, mockedPigpio)
  expect(gpio.pin).toBe(3)
  await gpio.close()
})

test('on edge', () => {
  const gpio = createGpio(3, mockedPigpio)

  const listener = jest.fn()
  gpio.on('edge', listener)

  expect(pigpio.ALT0).toBe(4)

  expect(mockedPigpio.callback).toBeCalledWith(3, 2, expect.anything())
})
test('on rising edge', () => {
  const gpio = createGpio(1, mockedPigpio)

  const listener = jest.fn()
  gpio.on('risingEdge', listener)

  expect(mockedPigpio.callback).toBeCalledWith(1, 0, expect.anything())
})
test('on falling edge', () => {
  const gpio = createGpio(2, mockedPigpio)

  const listener = jest.fn()
  gpio.on('fallingEdge', listener)

  expect(mockedPigpio.callback).toBeCalledWith(2, 1, expect.anything())

  // invoke callback
  const mockedCallback = mockedPigpio.callback as jest.Mock
  const func = mockedCallback.mock.calls[0][2] as (
    gpio: number,
    level: 0 | 1 | 'TIMEOUT',
    tick: number
  ) => void
  func(2, 1, 3)
  expect(listener).toHaveBeenCalledTimes(1)
})

test('on edge', () => {
  const gpio = createGpio(3, mockedPigpio)

  const listener = jest.fn()
  gpio.on('edge', listener)
  gpio.on('fallingEdge', listener)
  gpio.on('risingEdge', listener)

  expect(mockedPigpio.callback).toBeCalledWith(3, 0, expect.anything())
  expect(mockedPigpio.callback).toBeCalledWith(3, 1, expect.anything())
})
test('once edge', () => {
  const gpio = createGpio(2, mockedPigpio)

  const mockedCallback = {
    cancel: jest.fn(),
  }
  asMock(mockedPigpio.callback).mockReturnValueOnce(mockedCallback)

  const listener = jest.fn()
  gpio.once('edge', listener)

  expect(mockedPigpio.callback).toHaveBeenCalledTimes(1)

  // invoke callback
  const func = asMock(mockedPigpio.callback).mock.calls[0][2] as (
    gpio: number,
    level: 0 | 1 | 'TIMEOUT',
    tick: number
  ) => void
  func(2, 1, 3)
  expect(listener).toHaveBeenCalledTimes(1)
  expect(mockedCallback.cancel).toHaveBeenCalledTimes(1)
})
test('on/off notify edge', () => {
  const gpio = createGpio(3, mockedPigpio)
  const mockedCallback = {
    cancel: jest.fn(),
  }
  asMock(mockedPigpio.callback).mockReturnValueOnce(mockedCallback)

  const listener = jest.fn()
  gpio.on('edge', listener)
  // invoke callback
  const func = asMock(mockedPigpio.callback).mock.calls[0][2] as (
    gpio: number,
    level: 0 | 1 | 'TIMEOUT',
    tick: number
  ) => void
  func(2, 1, 3)
  expect(listener).toHaveBeenCalledTimes(1)

  gpio.off('edge', listener)
  expect(mockedCallback.cancel).toHaveBeenCalledTimes(1)
})
test('add/removeListener notify edge', () => {
  const gpio = createGpio(3, mockedPigpio)
  const mockedCallback = {
    cancel: jest.fn(),
  }
  asMock(mockedPigpio.callback).mockReturnValueOnce(mockedCallback)

  const listener = jest.fn()
  gpio.addListener('edge', listener)
  // invoke callback
  const func = asMock(mockedPigpio.callback).mock.calls[0][2] as (
    gpio: number,
    level: 0 | 1 | 'TIMEOUT',
    tick: number
  ) => void
  func(2, 1, 3)
  expect(listener).toHaveBeenCalledTimes(1)

  gpio.removeListener('edge', listener)
  expect(mockedCallback.cancel).toHaveBeenCalledTimes(1)
})

test('write', async () => {
  const gpio = createGpio(3, mockedPigpio)
  await gpio.write(1)
  expect(mockedPigpio.write).toBeCalledWith(3, 1)
})

test('read', async () => {
  const gpio = createGpio(3, mockedPigpio)

  asMock(mockedPigpio.read).mockResolvedValueOnce(1)
  const v = await gpio.read()
  expect(mockedPigpio.read).toBeCalledWith(3)
  expect(v).toBe(1)
})
test('read with error return', async () => {
  const gpio = createGpio(3, mockedPigpio)

  asMock(mockedPigpio.read).mockResolvedValueOnce(5)
  const v = gpio.read()
  await expect(v).rejects.toThrowError()
})

test.each([
  ['OUTPUT', 1],
  ['INPUT', 0],
] as const)('setMode', async (mode, value) => {
  const gpio = createGpio(3, mockedPigpio)
  await gpio.setMode(mode)
  expect(mockedPigpio.set_mode).toBeCalledWith(3, value)
})
test('setMode with error argument', async () => {
  const gpio = createGpio(3, mockedPigpio)
  const ret = gpio.setMode('a' as any)
  await expect(ret).rejects.toThrowError()
})

test.each([
  ['OUTPUT', 1],
  ['INPUT', 0],
] as const)('getMode', async (mode, value) => {
  const gpio = createGpio(3, mockedPigpio)
  asMock(mockedPigpio.get_mode).mockResolvedValueOnce(value)
  const v = await gpio.getMode()
  expect(mockedPigpio.get_mode).toBeCalledWith(3)
  expect(v).toBe(mode)
})
test('getMode with error return', async () => {
  const gpio = createGpio(3, mockedPigpio)

  asMock(mockedPigpio.get_mode).mockResolvedValueOnce(54)
  const v = gpio.getMode()
  await expect(v).rejects.toThrowError()
})

test.each([
  ['OFF', 0],
  ['DOWN', 1],
  ['UP', 2],
] as const)('setPullUpDown %s', async (mode, value) => {
  const gpio = createGpio(3, mockedPigpio)

  await gpio.setPullUpDown(mode)
  expect(mockedPigpio.set_pull_up_down).toBeCalledWith(3, value)
})
test('setPullUpDown with error argument', async () => {
  const gpio = createGpio(3, mockedPigpio)
  const ret = gpio.setPullUpDown('a' as any)
  await expect(ret).rejects.toThrowError()
})

test('setServoPulsewidth', async () => {
  const gpio = createGpio(3, mockedPigpio)

  await gpio.setServoPulsewidth(222)
  expect(mockedPigpio.set_servo_pulsewidth).toBeCalledWith(3, 222)
})

test('getServoPulsewidth', async () => {
  const gpio = createGpio(3, mockedPigpio)

  asMock(mockedPigpio.get_servo_pulsewidth).mockResolvedValueOnce(333)
  const r = await gpio.getServoPulsewidth()
  expect(mockedPigpio.get_servo_pulsewidth).toBeCalledWith(3)
  expect(r).toBe(333)
})

test('setPWMFrequency', async () => {
  const gpio = createGpio(3, mockedPigpio)

  await gpio.setPWMFrequency(222)
  expect(mockedPigpio.set_PWM_frequency).toBeCalledWith(3, 222)
})

test('getPWMFrequency', async () => {
  const gpio = createGpio(3, mockedPigpio)

  asMock(mockedPigpio.get_PWM_frequency).mockResolvedValueOnce(333)
  const r = await gpio.getPWMFrequency()
  expect(mockedPigpio.get_PWM_frequency).toBeCalledWith(3)
  expect(r).toBe(333)
})

test('setPWMDutycycle', async () => {
  const gpio = createGpio(3, mockedPigpio)

  await gpio.setPWMDutycycle(222)
  expect(mockedPigpio.set_PWM_dutycycle).toBeCalledWith(3, 222)
})

test('getPWMDutycycle', async () => {
  const gpio = createGpio(3, mockedPigpio)

  asMock(mockedPigpio.get_PWM_dutycycle).mockResolvedValueOnce(333)
  const r = await gpio.getPWMDutycycle()
  expect(mockedPigpio.get_PWM_dutycycle).toBeCalledWith(3)
  expect(r).toBe(333)
})

test('setPWMRange', async () => {
  const gpio = createGpio(3, mockedPigpio)

  await gpio.setPWMRange(222)
  expect(mockedPigpio.set_PWM_range).toBeCalledWith(3, 222)
})

test('getPWMRange', async () => {
  const gpio = createGpio(3, mockedPigpio)

  asMock(mockedPigpio.get_PWM_range).mockResolvedValueOnce(333)
  const r = await gpio.getPWMRange()
  expect(mockedPigpio.get_PWM_range).toBeCalledWith(3)
  expect(r).toBe(333)
})
test('getPWMRealRange', async () => {
  const gpio = createGpio(3, mockedPigpio)
  asMock(mockedPigpio.get_PWM_real_range).mockResolvedValueOnce(333)
  const r = await gpio.getPWMRealRange()
  expect(mockedPigpio.get_PWM_real_range).toBeCalledWith(3)
  expect(r).toBe(333)
})
