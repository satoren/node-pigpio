/* eslint-disable @typescript-eslint/unbound-method */
import { BBSpiFactory } from '@node-pigpio/highlevel/src/spi/bbspi'

import * as pigpio from '@node-pigpio/core'

const cs = 3
const miso = 17
const mosi = 27
const sclk = 22
const baudrate = 100000
const flags = 2313

jest.mock('@node-pigpio/core')

beforeEach(() => {
    jest.clearAllMocks()
})
test('open and close', async () => {
    const mockedPigpio = await pigpio.pi()

    const spiFactory = new BBSpiFactory(mockedPigpio)
    const spi = await spiFactory.create(cs, miso, mosi, sclk, baudrate, flags)

    expect(mockedPigpio.bb_spi_open).toBeCalledWith(3, 17, 27, 22, 100000, 2313)
    await spi.close()
    expect(mockedPigpio.bb_spi_close).toBeCalledWith(3)
})

test('write', async () => {
    const mockedPigpio = await pigpio.pi()
    const spiFactory = new BBSpiFactory(mockedPigpio)
    const spi = await spiFactory.create(cs, miso, mosi, sclk, baudrate, flags)
    const mockedXfer = (mockedPigpio.bb_spi_xfer as jest.Mock)
    mockedXfer.mockResolvedValueOnce([0, Buffer.alloc(0)])
    const writeData = Buffer.of(21)
    await spi.writeDevice(writeData)
    expect(mockedPigpio.bb_spi_xfer).toBeCalledWith(3, writeData)
})

test('read', async () => {
    const mockedPigpio = await pigpio.pi()
    const spiFactory = new BBSpiFactory(mockedPigpio)
    const spi = await spiFactory.create(cs, miso, mosi, sclk, baudrate, flags)
    const mockedXfer = (mockedPigpio.bb_spi_xfer as jest.Mock)
    const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
    mockedXfer.mockResolvedValueOnce([responseData.length, responseData])
    const readData = await spi.readDevice(responseData.length)
    expect(mockedXfer).toBeCalledWith(3, Buffer.alloc(10))
    expect(readData).toMatchObject(responseData)
})
