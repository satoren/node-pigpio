/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { pigpio } from './pigpio'
import { EventEmitter } from 'events'
import RequestCommand from '../socket/command/RequestCommands'

const mockConnect = jest.fn()
const setNoDelay = jest.fn()
let mockWrite = jest.fn((data: Buffer) => Buffer.concat([data.slice(0, 12), Buffer.of(0, 0, 0, 0)]))
const mockDestroy = jest.fn()
jest.mock('net', () => {
    return {
        Socket: jest.fn().mockImplementation(() => {
            const socket: EventEmitter = new EventEmitter()
            const socketMock: any = socket
            socketMock.connect = (...args:any[]) => {
                mockConnect(...args)
                setImmediate(() => {
                    socket.emit('connect', {})
                })
            }
            socketMock.setNoDelay = setNoDelay
            socketMock.write = (data:Buffer) => {
                setImmediate(() => {
                    socket.emit('data', mockWrite(data))
                })
            }
            socketMock.destroy = mockDestroy
            return socketMock
        })
    }
})

beforeEach(() => {
    mockWrite.mockClear()
    mockConnect.mockClear()
    setNoDelay.mockClear()
    mockDestroy.mockClear()
})
test('connect to gpiod', async () => {
    await pigpio('test', 333)

    expect(mockConnect).toBeCalledWith(333, 'test')
    expect(mockConnect).toBeCalledTimes(2)
    // Notify open
    expect(mockWrite).toBeCalledWith(Buffer.of(RequestCommand.NOIB.cmdNo, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
})
test('close', async () => {
    const pig = await pigpio('test', 333)
    await pig.close()

    // Notify Close
    expect(mockWrite).toBeCalledWith(Buffer.of(RequestCommand.NC.cmdNo, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
    expect(mockDestroy).toBeCalledTimes(2)
})

test('i2c open', async () => {
    const pig = await pigpio('test', 333)
    mockWrite.mockClear()
    await pig.i2c({ bus: 1, address: 21 })

    expect(mockWrite).toBeCalledWith(Buffer.of(RequestCommand.I2CO.cmdNo, 0, 0, 0, 1, 0, 0, 0, 21, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0))
})
test('i2c close', async () => {
    const pig = await pigpio('test', 333)

    const pii2chandle = 20
    mockWrite = jest.fn((data: Buffer) => Buffer.concat([data.slice(0, 12), Buffer.of(0, 0, 0, pii2chandle)]))
    const i2c = await pig.i2c({ bus: 1, address: 21 })
    mockWrite.mockClear()
    await pig.close()

    expect(mockWrite).toBeCalledWith(Buffer.of(RequestCommand.I2CC.cmdNo, 0, 0, 0, 0, 0, 0, pii2chandle, 0, 0, 0, 0, 0, 0, 0, 0))
})

test('bbi2c open', async () => {
    const pig = await pigpio('test', 333)
    mockWrite.mockClear()
    await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })

    expect(mockWrite).toBeCalledWith(Buffer.of(RequestCommand.BI2CO.cmdNo, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 210, 4, 0, 0))
})
test('bbi2c close', async () => {
    const pig = await pigpio('test', 333)

    const piid = 20
    mockWrite = jest.fn((data: Buffer) => Buffer.concat([data.slice(0, 12), Buffer.of(0, 0, 0, piid)]))
    const i2c = await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })
    mockWrite.mockClear()
    await i2c.close()

    expect(mockWrite).toBeCalledWith(Buffer.of(RequestCommand.BI2CC.cmdNo, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
})
