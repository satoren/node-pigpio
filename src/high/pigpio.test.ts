/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { pigpio } from './pigpio'
import { EventEmitter } from 'events'
import RequestCommand from '../lowlevel/command/RequestCommands'

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
const mockNotifySocket = {
    appendEvent: jest.fn(),
    removeEvent: jest.fn(),
    append: jest.fn(),
    remove: jest.fn(),
    close: jest.fn()
}
jest.mock('../lowlevel/NotifySocket', () => ({
    createNotifySocket: () => mockNotifySocket
}))

beforeEach(() => {
    mockWrite.mockClear()
    mockConnect.mockClear()
    setNoDelay.mockClear()
    mockDestroy.mockClear()
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
    await pig.i2c({ bus: 1, address: 21 })
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

test('auto close by i2c', async () => {
    const pig = await pigpio('test', 333, true)

    const i2c = await pig.i2c({ bus: 1, address: 21 })
    mockWrite.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await i2c.close()
    const c = await closed
    expect(c).toBe(true)
})

test('auto close by bbi2c', async () => {
    const pig = await pigpio('test', 333, true)

    const i2c = await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })
    mockWrite.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await i2c.close()
    const c = await closed
    expect(c).toBe(true)
})

test('auto close by spi', async () => {
    const pig = await pigpio('test', 333, true)

    const spi = await pig.spi({ channel: 0, baudRate: 233 })
    mockWrite.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await spi.close()
    const c = await closed
    expect(c).toBe(true)
})

test('auto close by bbspi', async () => {
    const pig = await pigpio('test', 333, true)

    const spi = await pig.spi({ miso: 2, mosi: 3, cs: 4, sclk: 5, baudRate: 233 })
    mockWrite.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await spi.close()
    const c = await closed
    expect(c).toBe(true)
})

test('auto close by gpio', async () => {
    const pig = await pigpio('test', 333, true)

    const gpio = pig.gpio(3)
    mockWrite.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await gpio.close()
    const c = await closed
    expect(c).toBe(true)
})

test('getCurrentTick', async () => {
    const pig = await pigpio('test', 333, true)

    mockWrite.mockReturnValueOnce(Buffer.of(RequestCommand.TICK.cmdNo, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 0, 0))
    const tick = await pig.getCurrentTick()
    expect(tick).toBe(33)
})

test('getHardwareRevision', async () => {
    const pig = await pigpio('test', 333, true)

    mockWrite.mockReturnValueOnce(Buffer.of(RequestCommand.HWVER.cmdNo, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 0, 0))
    const tick = await pig.getHardwareRevision()
    expect(tick).toBe(33)
})

test('getPigpioVersion', async () => {
    const pig = await pigpio('test', 333, true)

    mockWrite.mockReturnValueOnce(Buffer.of(RequestCommand.PIGPV.cmdNo, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 0, 0))
    const tick = await pig.getPigpioVersion()
    expect(tick).toBe(33)
})

test('events', async () => {
    const pig = await pigpio('test', 333, true)

    mockWrite.mockClear()
    const listener = jest.fn()
    pig.event.on('EVENT0', listener)

    expect(mockNotifySocket.appendEvent).toBeCalled()
})
