/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { pigpio } from './pigpio'
import RequestCommand from '../lowlevel/command/RequestCommands'

import { Socket } from '../__mocks__/net'
const mockSocket = new Socket()
jest.mock('net', () => ({ Socket: jest.fn().mockImplementation(() => mockSocket) }))

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
    jest.clearAllMocks()
})

test('double close', async () => {
    const pig = await pigpio('test', 333)

    await pig.close()
    await pig.close()
})
test('close all children', async () => {
    const pig = await pigpio('test', 333)

    const i2c = await pig.i2c({ bus: 1, address: 21 })
    const bbi2c = await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })
    const spi = await pig.spi({ channel: 0, baudRate: 233 })
    const bbspi = await pig.spi({ miso: 2, mosi: 3, cs: 4, sclk: 5, baudRate: 233 })
    const gpio = pig.gpio(3)

    const a = Promise.all([i2c, spi, bbspi, bbi2c, gpio].map(e => {
        return new Promise<boolean>((resolve) => {
            e.closeEvent.once(() => resolve(true))
        })
    }))

    await pig.close()
    const c = await a
    expect(c).toStrictEqual([true, true, true, true, true])
})
test('i2c open', async () => {
    const pig = await pigpio('test', 333)
    mockSocket.write.mockClear()
    await pig.i2c({ bus: 1, address: 21 })

    expect(mockSocket.write).toBeCalledWith(Buffer.of(RequestCommand.I2CO.cmdNo, 0, 0, 0, 1, 0, 0, 0, 21, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0))
    await pig.close()
})
test('i2c close', async () => {
    const pig = await pigpio('test', 333)
    const pii2chandle = 20
    mockSocket.write.mockImplementation((data: Buffer) => mockSocket.emit('data', Buffer.concat([data.slice(0, 12), Buffer.of(0, 0, 0, pii2chandle)])))
    const i2c = await pig.i2c({ bus: 1, address: 21 })
    mockSocket.write.mockClear()
    await i2c.close()

    expect(mockSocket.write).toBeCalledWith(Buffer.of(RequestCommand.I2CC.cmdNo, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0))
    await pig.close()
})

test('bbi2c open', async () => {
    const pig = await pigpio('test', 333)
    mockSocket.write.mockClear()
    await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })

    expect(mockSocket.write).toBeCalledWith(Buffer.of(RequestCommand.BI2CO.cmdNo, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 210, 4, 0, 0))
    await pig.close()
})
test('bbi2c close', async () => {
    const pig = await pigpio('test', 333)

    const piid = 20
    const i2c = await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })
    mockSocket.write.mockClear()
    mockSocket.write.mockImplementation((data: Buffer) => mockSocket.emit('data', Buffer.concat([data.slice(0, 12), Buffer.of(0, 0, 0, piid)])))
    await i2c.close()

    expect(mockSocket.write).toBeCalledWith(Buffer.of(RequestCommand.BI2CC.cmdNo, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
    await pig.close()
})

test('auto close by i2c', async () => {
    const pig = await pigpio('test', 333, true)

    const i2c = await pig.i2c({ bus: 1, address: 21 })
    mockSocket.write.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await i2c.close()
    const c = await closed
    expect(c).toBe(true)
    await pig.close()
})

test('auto close by bbi2c', async () => {
    const pig = await pigpio('test', 333, true)

    const i2c = await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })
    mockSocket.write.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await i2c.close()
    const c = await closed
    expect(c).toBe(true)
    await pig.close()
})

test('auto close by spi', async () => {
    const pig = await pigpio('test', 333, true)

    const spi = await pig.spi({ channel: 0, baudRate: 233 })
    mockSocket.write.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await spi.close()
    const c = await closed
    expect(c).toBe(true)
    await pig.close()
})

test('auto close by bbspi', async () => {
    const pig = await pigpio('test', 333, true)

    const spi = await pig.spi({ miso: 2, mosi: 3, cs: 4, sclk: 5, baudRate: 233 })
    mockSocket.write.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await spi.close()
    const c = await closed
    expect(c).toBe(true)
    await pig.close()
})

test('auto close by gpio', async () => {
    const pig = await pigpio('test', 333, true)

    const gpio = pig.gpio(3)
    mockSocket.write.mockClear()
    const closed = new Promise<boolean>((resolve) => {
        pig.closeEvent.once(() => resolve(true))
    })
    await gpio.close()
    const c = await closed
    expect(c).toBe(true)
    await pig.close()
})

test('getCurrentTick', async () => {
    const pig = await pigpio('test', 333, true)

    mockSocket.write.mockImplementation((data: Buffer) => mockSocket.emit('data', Buffer.of(RequestCommand.TICK.cmdNo, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 0, 0)))
    const tick = await pig.getCurrentTick()
    expect(tick).toBe(33)
})

test('getHardwareRevision', async () => {
    const pig = await pigpio('test', 333, true)

    mockSocket.write.mockImplementation((data: Buffer) => mockSocket.emit('data', Buffer.of(RequestCommand.HWVER.cmdNo, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 0, 0)))
    const tick = await pig.getHardwareRevision()
    expect(tick).toBe(33)
    await pig.close()
})

test('getPigpioVersion', async () => {
    const pig = await pigpio('test', 333, true)

    mockSocket.write.mockImplementation((data: Buffer) => mockSocket.emit('data', Buffer.of(RequestCommand.PIGPV.cmdNo, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 0, 0, 0)))
    const tick = await pig.getPigpioVersion()
    expect(tick).toBe(33)
})
test('eventTrigger', async () => {
    const pig = await pigpio('test', 333, true)
    mockSocket.write.mockImplementation((data: Buffer) => mockSocket.emit('data', Buffer.of(RequestCommand.EVT.cmdNo, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)))
    await pig.eventTrigger('EVENT10')
    expect(mockSocket.write).toBeCalledWith(Buffer.of(RequestCommand.EVT.cmdNo, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
    await pig.close()
})

test('eventTrigger with invalid', async () => {
    const pig = await pigpio('test', 333, true)
    const ret = pig.eventTrigger('cc' as any)
    await expect(ret).rejects.toThrowError()
    await pig.close()
})

test('events', async () => {
    const pig = await pigpio('test', 333, true)

    mockSocket.write.mockClear()
    const listener = jest.fn()
    pig.event.on('EVENT0', listener)

    expect(mockNotifySocket.appendEvent).toBeCalled()
    // invoke callback
    const func = mockNotifySocket.appendEvent.mock.calls[0][0].func as (event: number, tick: number) => void
    func(0, 3)
    expect(listener).toHaveBeenCalledTimes(1)

    expect(mockNotifySocket.removeEvent).not.toBeCalled()

    pig.event.off('EVENT0', listener)
    expect(mockNotifySocket.removeEvent).toBeCalled()
    await pig.close()
})
test('events multiple on', async () => {
    const pig = await pigpio('test', 333, true)

    mockSocket.write.mockClear()
    const listener = jest.fn()
    pig.event.on('EVENT0', listener)
    pig.event.on('EVENT1', listener)
    pig.event.on('EVENT2', listener)
    pig.event.on('EVENT3', listener)

    expect(mockNotifySocket.appendEvent).toBeCalled()
    // invoke callback
    const func = mockNotifySocket.appendEvent.mock.calls[0][0].func as (event: number, tick: number) => void
    func(0, 3)
    expect(listener).toHaveBeenCalledTimes(1)

    expect(mockNotifySocket.removeEvent).not.toBeCalled()

    pig.event.off('EVENT0', listener)
    expect(mockNotifySocket.removeEvent).toBeCalledTimes(1)
    pig.event.off('EVENT1', listener)
    expect(mockNotifySocket.removeEvent).toBeCalledTimes(2)
    pig.event.off('EVENT1', listener)
    expect(mockNotifySocket.removeEvent).toBeCalledTimes(2)
    pig.event.off('EVENT3', listener)
    expect(mockNotifySocket.removeEvent).toBeCalledTimes(3)
    pig.event.off('EVENT6', listener)
    expect(mockNotifySocket.removeEvent).toBeCalledTimes(3)
    await pig.close()
})

test('events once', async () => {
    const pig = await pigpio('test', 333, true)

    mockSocket.write.mockClear()
    const listener = jest.fn()
    pig.event.once('EVENT0', listener)

    expect(mockNotifySocket.appendEvent).toBeCalled()

    // invoke callback
    const func = mockNotifySocket.appendEvent.mock.calls[0][0].func as (event: number, tick: number) => void
    func(0, 3)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(mockNotifySocket.removeEvent).toBeCalled()
    await pig.close()
})
