import { I2cFactory } from './i2c'

import RequestCommand from '../../socket/command/RequestCommands'
import { mockRequestSocket as requestSocket } from '../../socket/__mocks__/RequestSocket'
import * as pigpio from '../../socket/pi'

jest.mock('../../socket/RequestSocket', () => (
    { createRequestSocket: () => requestSocket }))
jest.mock('../../socket/NotifySocket')

const bus = 1
const address = 0x73
const flags = 3

let i2cFactory: I2cFactory
beforeEach(async () => {
    i2cFactory = new I2cFactory(await pigpio.pi())
    requestSocket.request.mockClear()
})
test('open and close', async () => {
    const i2chandle = 99
    requestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.I2CO.cmdNo, p1: bus, p2: address, res: i2chandle }))
    const i2c = await i2cFactory.create(bus, address, flags)

    const flag = Buffer.alloc(4)
    flag.writeUInt32LE(flags)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CO.cmdNo, extension: flag, p1: bus, p2: address, responseExtension: false })
    await i2c.close()
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CC.cmdNo, p1: i2chandle, p2: 0, responseExtension: false })
})

test('write', async () => {
    const i2chandle = 99
    requestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.I2CO.cmdNo, p1: bus, p2: address, res: i2chandle }))
    const i2c = await i2cFactory.create(bus, address, flags)
    requestSocket.request.mockClear()
    const writeData = Buffer.of(21)
    await i2c.writeDevice(writeData)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CWD.cmdNo, p1: i2chandle, p2: 0, extension: writeData, responseExtension: false })
})

test('write over 255', async () => {
    const i2chandle = 99
    requestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.I2CO.cmdNo, p1: bus, p2: address, res: i2chandle }))
    const i2c = await i2cFactory.create(bus, address, flags)
    requestSocket.request.mockClear()

    const writeData = Buffer.alloc(1023)

    await i2c.writeDevice(writeData)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CWD.cmdNo, p1: i2chandle, p2: 0, extension: writeData, responseExtension: false })
})

test('read', async () => {
    const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
    const i2chandle = 99
    requestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.I2CO.cmdNo, p1: bus, p2: address, res: i2chandle })).mockResolvedValueOnce({ cmd: RequestCommand.I2CRD.cmdNo, p1: i2chandle, p2: 0, res: responseData.length, extension: responseData })
    const i2c = await i2cFactory.create(bus, address, flags)

    const readData = await i2c.readDevice(responseData.length)

    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CRD.cmdNo, p1: i2chandle, p2: responseData.length, responseExtension: true })
    expect(readData).toMatchObject(responseData)
})

test('zip', async () => {
    const writeData = Buffer.of(21)
    const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
    const responseData2 = Buffer.of(32, 22)
    const i2chandle = 99
    requestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.I2CO.cmdNo, p1: bus, p2: address, res: i2chandle })).mockResolvedValueOnce({ cmd: RequestCommand.BI2CZ.cmdNo, p1: i2chandle, p2: 0, res: responseData.length + responseData2.length, extension: Buffer.concat([responseData, responseData2]) })
    const i2c = await i2cFactory.create(bus, address, flags)

    const [readData, readData2] = await i2c.zip({ type: 'Write', data: writeData }, { type: 'Read', size: responseData.length }, { type: 'Read', size: responseData2.length })

    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CZ.cmdNo, p1: i2chandle, p2: 0, responseExtension: true, extension: Buffer.of(7, 1, ...writeData, 6, responseData.length, 6, responseData2.length, 0) })
    expect(readData).toMatchObject(responseData)
    expect(readData2).toMatchObject(responseData2)
})
