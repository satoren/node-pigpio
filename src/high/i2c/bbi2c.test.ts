/* eslint-disable @typescript-eslint/require-await */
import { BBI2cFactory } from './bbi2c'

import RequestCommand from '../../lowlevel/command/RequestCommands'

import { mockRequestSocket as requestSocket } from '../../lowlevel/__mocks__/RequestSocket'
import * as pigpio from '../../lowlevel'

jest.mock('../../lowlevel/RequestSocket', () => (
    { createRequestSocket: () => requestSocket }))
jest.mock('../../lowlevel/NotifySocket')

const device = 0x11
const sda = 17
const scl = 27
const baudrate = 100000

let i2cFactory:BBI2cFactory

beforeEach(async () => {
    i2cFactory = new BBI2cFactory(await pigpio.pi())
    requestSocket.request.mockClear()
})
test('open and close', async () => {
    const i2c = await i2cFactory.create(device, sda, scl, baudrate)

    const baud = Buffer.alloc(4)
    baud.writeUInt32LE(baudrate)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CO.cmdNo, extension: baud, p1: sda, p2: scl, responseExtension: false })
    requestSocket.request.mockClear()
    await i2c.close()
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CC.cmdNo, p1: sda, p2: 0, responseExtension: false })
})

test('write', async () => {
    const i2c = await i2cFactory.create(device, sda, scl, baudrate)
    requestSocket.request.mockClear()
    const writeData = Buffer.of(21)
    await i2c.writeDevice(writeData)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CZ.cmdNo, extension: Buffer.of(4, sda, 2, 7, 1, ...writeData, 3, 0), p1: sda, p2: 0, responseExtension: true })
})

test('write over 255', async () => {
    const i2c = await i2cFactory.create(device, sda, scl, baudrate)
    requestSocket.request.mockClear()
    const writeData = Buffer.alloc(1023)
    await i2c.writeDevice(writeData)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CZ.cmdNo, extension: Buffer.of(4, sda, 2, 1, 7, 255, 3, ...writeData, 3, 0), p1: sda, p2: 0, responseExtension: true })
})

test('read', async () => {
    const i2c = await i2cFactory.create(device, sda, scl, baudrate)
    requestSocket.request.mockClear()
    const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
    requestSocket.request.mockResolvedValueOnce({ cmd: RequestCommand.BI2CZ.cmdNo, p1: sda, p2: 0, res: responseData.length, extension: responseData })
    const readData = await i2c.readDevice(responseData.length)
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CZ.cmdNo, extension: Buffer.of(4, sda, 2, 6, responseData.length, 3, 0), p1: sda, p2: 0, responseExtension: true })
    expect(readData).toMatchObject(responseData)
})

test('read 2 sequence by zip ', async () => {
    const i2c = await i2cFactory.create(device, sda, scl, baudrate)
    requestSocket.request.mockClear()
    const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
    const responseData2 = Buffer.of(77, 66)
    requestSocket.request.mockResolvedValueOnce({ cmd: RequestCommand.BI2CZ.cmdNo, p1: sda, p2: 0, res: responseData.length + responseData2.length, extension: Buffer.concat([responseData, responseData2]) })
    const [readData, readData2] = await i2c.zip({ type: 'Read', size: responseData.length }, { type: 'Read', size: responseData2.length })
    expect(requestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CZ.cmdNo, extension: Buffer.of(4, sda, 2, 6, responseData.length, 2, 6, responseData2.length, 3, 0), p1: sda, p2: 0, responseExtension: true })
    expect(readData).toMatchObject(responseData)
    expect(readData2).toMatchObject(responseData2)
})
