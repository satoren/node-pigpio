/* eslint-disable @typescript-eslint/require-await */
import { SpiFactory } from './spi'
import RequestCommand from '../../socket/command/RequestCommands'
import * as pigpio from '../../socket/pi'

import { mockRequestSocket as requestSocket } from '../../socket/__mocks__/RequestSocket'

jest.mock('../../socket/RequestSocket', () => (
    { createRequestSocket: () => requestSocket }))
jest.mock('../../socket/NotifySocket')

const channel = 3
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

let spiFactory:SpiFactory
beforeEach(async () => {
    spiFactory = new SpiFactory(await pigpio.pi())
    jest.clearAllMocks()
})
test('open and close', async () => {
    const spihandle = 99
    requestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.I2CO.cmdNo, p1: channel, p2: baudrate, res: spihandle }))
    const spi = await spiFactory.create(channel, baudrate, flags)

    const extent = toBuffer(flags)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.SPIO.cmdNo, extension: extent, p1: channel, p2: baudrate, responseExtension: false })
    requestSocket.request.mockClear()
    await spi.close()
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.SPIC.cmdNo, p1: spihandle, p2: 0, responseExtension: false })
})

test('write', async () => {
    const spi = await spiFactory.create(channel, baudrate, flags)

    requestSocket.request.mockClear()
    const writeData = Buffer.of(21)
    await spi.writeDevice(writeData)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.SPIW.cmdNo, extension: writeData, p1: 0, p2: 0, responseExtension: false })
})

test('read', async () => {
    const spi = await spiFactory.create(channel, baudrate, flags)
    requestSocket.request.mockClear()
    const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
    requestSocket.request.mockResolvedValueOnce({ cmd: RequestCommand.SPIR.cmdNo, p1: 0, p2: 0, res: responseData.length, extension: responseData })
    const readData = await spi.readDevice(responseData.length)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.SPIR.cmdNo, p1: 0, p2: responseData.length, responseExtension: true })
    expect(readData).toMatchObject(responseData)
})

test('xfer', async () => {
    const spi = await spiFactory.create(channel, baudrate, flags)
    requestSocket.request.mockClear()
    const writeData = Buffer.of(21)
    const responseData = Buffer.of(77)
    requestSocket.request.mockResolvedValueOnce({ cmd: RequestCommand.SPIX.cmdNo, p1: 0, p2: 0, res: responseData.length, extension: responseData })
    const readData = await spi.xferDevice(writeData)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.SPIX.cmdNo, p1: 0, p2: 0, extension: writeData, responseExtension: true })
    expect(readData).toMatchObject(responseData)
})
