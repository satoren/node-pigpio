/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */
import { BBI2cFactory } from '@node-pigpio/highlevel/src/i2c/bbi2c'

import * as pigpio from '@node-pigpio/core'

const device = 0x51
const sda = 17
const scl = 27
const baudrate = 100000

let mockedPigpio: pigpio.pigpio
let i2cFactory: BBI2cFactory
beforeEach(async () => {
  mockedPigpio = await pigpio.pi()
  i2cFactory = new BBI2cFactory(mockedPigpio)
  jest.clearAllMocks()
})
test('open and close', async () => {
  const i2c = await i2cFactory.create(device, sda, scl, baudrate)

  const baud = Buffer.alloc(4)
  baud.writeUInt32LE(baudrate)
  expect(mockedPigpio.bb_i2c_open).toBeCalledWith(sda, scl, baudrate)
  await i2c.close()
  expect(mockedPigpio.bb_i2c_close).toBeCalledWith(sda)
})
test('write', async () => {
  const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
  const i2c = await i2cFactory.create(device, sda, scl, baudrate)
  const writeData = Buffer.of(21)
  const mockedZip = mockedPigpio.bb_i2c_zip as jest.Mock
  mockedZip.mockResolvedValueOnce([responseData.length, responseData])
  await i2c.writeDevice(writeData)
  expect(mockedPigpio.bb_i2c_zip).toBeCalledWith(
    sda,
    Buffer.of(4, device, 2, 7, 1, 21, 3, 0)
  )
})

test('write over 255', async () => {
  const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
  const i2c = await i2cFactory.create(device, sda, scl, baudrate)
  const writeData = Buffer.alloc(1023)
  const mockedZip = mockedPigpio.bb_i2c_zip as jest.Mock
  mockedZip.mockResolvedValueOnce([responseData.length, responseData])
  await i2c.writeDevice(writeData)
  expect(mockedPigpio.bb_i2c_zip).toBeCalledWith(
    sda,
    Buffer.of(4, device, 2, 1, 7, 255, 3, ...writeData, 3, 0)
  )
})

test('read', async () => {
  const i2c = await i2cFactory.create(device, sda, scl, baudrate)
  const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
  const mockedZip = mockedPigpio.bb_i2c_zip as jest.Mock
  mockedZip.mockResolvedValueOnce([responseData.length, responseData])
  const readData = await i2c.readDevice(responseData.length)
  expect(mockedPigpio.bb_i2c_zip).toBeCalledWith(
    sda,
    Buffer.of(4, device, 2, 6, responseData.length, 3, 0)
  )
  expect(readData).toMatchObject(responseData)
})

test('read 2 sequence by zip ', async () => {
  const i2c = await i2cFactory.create(device, sda, scl, baudrate)
  const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
  const responseData2 = Buffer.of(77, 66)
  const mockedZip = mockedPigpio.bb_i2c_zip as jest.Mock
  mockedZip.mockResolvedValueOnce([
    responseData.length + responseData2.length,
    Buffer.concat([responseData, responseData2]),
  ])
  const [readData, readData2] = await i2c.zip(
    { type: 'Read', size: responseData.length },
    { type: 'Read', size: responseData2.length }
  )
  expect(mockedPigpio.bb_i2c_zip).toBeCalledWith(
    sda,
    Buffer.of(
      4,
      device,
      2,
      6,
      responseData.length,
      2,
      6,
      responseData2.length,
      3,
      0
    )
  )
  expect(readData).toMatchObject(responseData)
  expect(readData2).toMatchObject(responseData2)
})

test('Can open same pin with same parameter', async () => {
  const i2c = await i2cFactory.create(device, sda, scl, baudrate)
  expect(mockedPigpio.bb_i2c_open).toBeCalledWith(sda, scl, baudrate)
  const i2c2 = await i2cFactory.create(device + 1, sda, scl, baudrate)
  await i2c.close()
  expect(mockedPigpio.bb_i2c_close).not.toBeCalled()
  await i2c2.close()
  expect(mockedPigpio.bb_i2c_close).toBeCalledWith(sda)
  expect(mockedPigpio.bb_i2c_close).toBeCalledTimes(1)
  expect(mockedPigpio.bb_i2c_open).toBeCalledTimes(1)
})
test('Can not open same pin with different parameter', async () => {
  const i2c = await i2cFactory.create(device, sda, scl, baudrate)
  expect(mockedPigpio.bb_i2c_open).toBeCalledWith(sda, scl, baudrate)
  const i2c2 = i2cFactory.create(device, sda, scl, baudrate + 100)
  const i2c3 = i2cFactory.create(device, sda, scl + 1, baudrate)

  await expect(i2c2).rejects.toThrowError()
  await expect(i2c3).rejects.toThrowError()
  await i2c.close()
  expect(mockedPigpio.bb_i2c_close).toBeCalledWith(sda)

  expect(mockedPigpio.bb_i2c_close).toBeCalledTimes(1)
  expect(mockedPigpio.bb_i2c_open).toBeCalledTimes(1)
  // alow reopen after closed i2c
  const i2c4 = await i2cFactory.create(device, sda, scl, baudrate + 1011)

  await i2c4.close()
  expect(mockedPigpio.bb_i2c_close).toBeCalledTimes(2)
  expect(mockedPigpio.bb_i2c_open).toBeCalledTimes(2)
})
