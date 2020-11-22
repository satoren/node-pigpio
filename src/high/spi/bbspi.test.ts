/* eslint-disable @typescript-eslint/require-await */
import { BBSpiFactory } from './bbspi'

import RequestCommand from '../../lowlevel/command/RequestCommands'
import { mockRequestSocket as requestSocket } from '../../lowlevel/__mocks__/RequestSocket'
import * as pigpio from '../../lowlevel'

const cs = 3
const miso = 17
const mosi = 27
const sclk = 22
const baudrate = 100000
const flags = 2313

const toBuffer = (...nums: number[]) => {
    const buffer = Buffer.alloc(nums.length * 4)
    let offset = 0
    for (const n of nums) {
        offset = buffer.writeUInt32LE(n, offset)
    }
    return buffer
}

jest.mock('../../lowlevel/RequestSocket', () => (
    { createRequestSocket: () => requestSocket }))
jest.mock('../../lowlevel/NotifySocket')

let spiFactory:BBSpiFactory
beforeEach(async () => {
    spiFactory = new BBSpiFactory(await pigpio.pi())
    jest.clearAllMocks()
})

beforeEach(() => {
    requestSocket.request.mockClear()
})
test('open and close', async () => {
    const spi = await spiFactory.create(cs, miso, mosi, sclk, baudrate, flags)

    const extent = toBuffer(miso, mosi, sclk, baudrate, flags)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BSPIO.cmdNo, extension: extent, p1: cs, p2: 0, responseExtension: false })
    requestSocket.request.mockClear()
    await spi.close()
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BSPIC.cmdNo, p1: cs, p2: 0, responseExtension: false })
})

test('write', async () => {
    const spi = await spiFactory.create(cs, miso, mosi, sclk, baudrate, flags)
    requestSocket.request.mockClear()
    const writeData = Buffer.of(21)
    await spi.writeDevice(writeData)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BSPIX.cmdNo, extension: writeData, p1: cs, p2: 0, responseExtension: true })
})

test('read', async () => {
    const spi = await spiFactory.create(cs, miso, mosi, sclk, baudrate, flags)
    requestSocket.request.mockClear()
    const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
    requestSocket.request.mockResolvedValueOnce({ cmd: RequestCommand.BSPIX.cmdNo, p1: cs, p2: 0, res: responseData.length, extension: responseData })
    const readData = await spi.readDevice(responseData.length)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BSPIX.cmdNo, extension: Buffer.alloc(responseData.length), p1: cs, p2: 0, responseExtension: true })
    expect(readData).toMatchObject(responseData)
})
