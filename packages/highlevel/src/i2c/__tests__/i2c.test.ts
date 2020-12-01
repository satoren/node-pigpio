/* eslint-disable @typescript-eslint/unbound-method */
import { I2cFactory } from '@node-pigpio/highlevel/src/i2c/i2c'

import * as pigpio from '@node-pigpio/core'

const bus = 1
const address = 0x73
const flags = 3

let mockedPigpio: pigpio.pigpio
let i2cFactory: I2cFactory
beforeEach(async () => {
  mockedPigpio = await pigpio.pi()
  i2cFactory = new I2cFactory(await pigpio.pi())
  jest.clearAllMocks()
})

test('open and close', async () => {
  const i2chandle = 99

  const mockedOpen = mockedPigpio.i2c_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(i2chandle)

  const i2c = await i2cFactory.create(bus, address, flags)

  const flag = Buffer.alloc(4)
  flag.writeUInt32LE(flags)
  expect(mockedPigpio.i2c_open).toBeCalledWith(bus, address, flags)
  await i2c.close()
  expect(mockedPigpio.i2c_close).toBeCalledWith(i2chandle)
})

test('write', async () => {
  const i2chandle = 99
  const mockedOpen = mockedPigpio.i2c_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(i2chandle)
  const i2c = await i2cFactory.create(bus, address, flags)
  const writeData = Buffer.of(21)
  await i2c.writeDevice(writeData)
  expect(mockedPigpio.i2c_write_device).toBeCalledWith(i2chandle, writeData)
})

test('read', async () => {
  const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
  const i2chandle = 99

  const mockedOpen = mockedPigpio.i2c_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(i2chandle)

  const mockedRead = mockedPigpio.i2c_read_device as jest.Mock
  mockedRead.mockResolvedValueOnce([responseData.length, responseData])

  const i2c = await i2cFactory.create(bus, address, flags)

  const readData = await i2c.readDevice(responseData.length)

  expect(mockedPigpio.i2c_read_device).toBeCalledWith(99, 10)
  expect(readData).toMatchObject(responseData)
})

test('zip', async () => {
  const writeData = Buffer.of(21)
  const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
  const responseData2 = Buffer.of(32, 22)
  const i2chandle = 99

  const mockedOpen = mockedPigpio.i2c_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(i2chandle)
  const i2c = await i2cFactory.create(bus, address, flags)

  const mockedZip = mockedPigpio.i2c_zip as jest.Mock
  mockedZip.mockResolvedValueOnce([
    responseData.length + responseData2.length,
    Buffer.concat([responseData, responseData2]),
  ])

  const [readData, readData2] = await i2c.zip(
    { type: 'Write', data: writeData },
    { type: 'Read', size: responseData.length },
    { type: 'Read', size: responseData2.length }
  )

  expect(mockedPigpio.i2c_zip).toBeCalledWith(
    99,
    Buffer.of(7, 1, 21, 6, 10, 6, 2, 0)
  )
  expect(readData).toMatchObject(responseData)
  expect(readData2).toMatchObject(responseData2)
})
