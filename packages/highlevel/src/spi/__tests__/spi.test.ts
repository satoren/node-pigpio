/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */
import { SpiFactory } from '@node-pigpio/highlevel/src/spi/spi'
import * as pigpio from '@node-pigpio/core'

jest.mock('@node-pigpio/core')

beforeEach(() => {
  jest.clearAllMocks()
})

const channel = 3
const baudrate = 100000
const flags = 2313

let mockedPigpio: pigpio.pigpio
let spiFactory: SpiFactory
beforeEach(async () => {
  mockedPigpio = await pigpio.pi()
  spiFactory = new SpiFactory(mockedPigpio)
  jest.clearAllMocks()
})
test('open and close', async () => {
  const spihandle = 99

  const mockedOpen = mockedPigpio.spi_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(spihandle)

  const spi = await spiFactory.create(channel, baudrate, flags)
  expect(mockedOpen).toBeCalledWith(channel, baudrate, flags)
  const mockedClose = mockedPigpio.spi_close as jest.Mock
  await spi.close()
  expect(mockedClose).toBeCalledWith(spihandle)
})

test('write', async () => {
  const spihandle = 99
  const mockedOpen = mockedPigpio.spi_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(spihandle)
  const spi = await spiFactory.create(channel, baudrate, flags)

  const writeData = Buffer.of(21)
  await spi.writeDevice(writeData)
  expect(mockedPigpio.spi_write).toBeCalledWith(99, Buffer.of(21))
})
test('read', async () => {
  const spihandle = 99
  const mockedOpen = mockedPigpio.spi_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(spihandle)
  const spi = await spiFactory.create(channel, baudrate, flags)
  const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)

  const mockedRead = mockedPigpio.spi_read as jest.Mock
  mockedRead.mockResolvedValueOnce([responseData.length, responseData])
  const readData = await spi.readDevice(33)
  expect(mockedRead).toBeCalledWith(99, 33)
  expect(readData).toMatchObject(responseData)
})
test('read with error', async () => {
  const spihandle = 99
  const mockedOpen = mockedPigpio.spi_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(spihandle)
  const spi = await spiFactory.create(channel, baudrate, flags)

  const mockedRead = mockedPigpio.spi_read as jest.Mock
  mockedRead.mockResolvedValueOnce([0, Buffer.alloc(0)])
  await expect(spi.readDevice(33)).rejects.toThrow(
    'Cant readDevice: Unknown reason'
  )
  await expect(spi.readDevice(-1)).rejects.toThrow('Invalid Argument')
})

test('xfer', async () => {
  const spihandle = 99
  const mockedOpen = mockedPigpio.spi_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(spihandle)
  const spi = await spiFactory.create(channel, baudrate, flags)

  const writeData = Buffer.of(21)
  const responseData = Buffer.of(77)
  const mockedXfer = mockedPigpio.spi_xfer as jest.Mock
  mockedXfer.mockResolvedValueOnce([responseData.length, responseData])
  const readData = await spi.xferDevice(writeData)
  expect(mockedXfer).toBeCalledWith(99, writeData)
  expect(readData).toMatchObject(responseData)

  await expect(spi.xferDevice(Buffer.alloc(0))).rejects.toThrow(
    'Invalid Argument'
  )
})

test('invalid handle', async () => {
  const spihandle = 99

  const mockedOpen = mockedPigpio.spi_open as jest.Mock
  mockedOpen.mockResolvedValueOnce(spihandle)

  const spi = await spiFactory.create(channel, baudrate, flags)
  await spi.close()
  await expect(spi.writeDevice(Buffer.from([23]))).rejects.toThrow(
    'Invalid Handle'
  )
  await expect(spi.xferDevice(Buffer.from([23]))).rejects.toThrow(
    'Invalid Handle'
  )
  await expect(spi.readDevice(21)).rejects.toThrow('Invalid Handle')
  await expect(spi.close()).rejects.toThrow('Invalid Handle')
})
