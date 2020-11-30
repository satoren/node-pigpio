/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { pigpio } from '@node-pigpio/highlevel/src/pigpio'
import * as llpigpio from '@node-pigpio/core'

jest.mock('@node-pigpio/core')

const asMock = (func: unknown): jest.Mock => {
    return func as jest.Mock
}

let mockedPigpio: llpigpio.pigpio
beforeEach(async () => {
    mockedPigpio = await llpigpio.pi()
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

    const i2chandle = 32342

    asMock(mockedPigpio.i2c_open).mockResolvedValueOnce(i2chandle)

    await pig.i2c({ bus: 1, address: 21 })

    expect(mockedPigpio.i2c_open).toBeCalledWith(1, 21, 0)
    await pig.close()
})

test('i2c close', async () => {
    const pig = await pigpio('test', 333)
    const pii2chandle = 20

    asMock(mockedPigpio.i2c_open).mockResolvedValueOnce(pii2chandle)

    const i2c = await pig.i2c({ bus: 1, address: 21 })
    await i2c.close()
    expect(mockedPigpio.i2c_close).toBeCalledWith(pii2chandle)

    await pig.close()
})

test('bbi2c open', async () => {
    const pig = await pigpio('test', 333)
    await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })

    expect(mockedPigpio.bb_i2c_open).toBeCalledWith(1, 2, 1234)
    await pig.close()
})

test('bbi2c close', async () => {
    const pig = await pigpio('test', 333)

    await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })

    expect(mockedPigpio.bb_i2c_open).toBeCalledWith(1, 2, 1234)
    await pig.close()

    const i2c = await pig.i2c({ address: 21, baudRate: 1234, sda: 1, scl: 2 })
    await i2c.close()
    expect(mockedPigpio.bb_i2c_close).toBeCalledWith(1)
    await pig.close()
})

test('auto close by i2c', async () => {
    const pig = await pigpio('test', 333, true)

    const i2c = await pig.i2c({ bus: 1, address: 21 })
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

    asMock(mockedPigpio.get_current_tick).mockReturnValueOnce(32432)
    const tick = await pig.getCurrentTick()
    expect(tick).toBe(32432)
})

test('getHardwareRevision', async () => {
    const pig = await pigpio('test', 333, true)

    asMock(mockedPigpio.get_hardware_revision).mockReturnValueOnce(33)
    const tick = await pig.getHardwareRevision()
    expect(tick).toBe(33)
    await pig.close()
})

test('getPigpioVersion', async () => {
    const pig = await pigpio('test', 333, true)

    asMock(mockedPigpio.get_pigpio_version).mockReturnValueOnce(32432)
    const tick = await pig.getPigpioVersion()
    expect(tick).toBe(32432)
})
test('eventTrigger', async () => {
    const pig = await pigpio('test', 333, true)
    await pig.eventTrigger('EVENT10')
    expect(mockedPigpio.event_trigger).toBeCalledWith(10)
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

    const mockedEven = {
        cancel: jest.fn()
    }
    asMock(mockedPigpio.event_callback).mockReturnValueOnce(mockedEven)

    const listener = jest.fn()
    pig.event.on('EVENT0', listener)

    expect(mockedPigpio.event_callback).toBeCalledWith(0, expect.anything())
    // invoke callback

    const func = asMock(mockedPigpio.event_callback).mock.calls[0][1] as (event: number, tick: number) => void
    func(0, 3)
    expect(listener).toHaveBeenCalledTimes(1)

    pig.event.off('EVENT0', listener)
    expect(mockedEven.cancel).toHaveBeenCalledTimes(1)
    await pig.close()
})

test('events multiple on', async () => {
    const pig = await pigpio('test', 333, true)

    const mockedEven = {
        cancel: jest.fn()
    }
    asMock(mockedPigpio.event_callback).mockReturnValue(mockedEven)

    const listener = jest.fn()
    pig.event.on('EVENT0', listener)
    pig.event.on('EVENT1', listener)
    pig.event.on('EVENT2', listener)
    pig.event.on('EVENT3', listener)
    pig.event.on('EVENT14', listener)

    expect(mockedPigpio.event_callback).toBeCalledWith(0, expect.anything())
    expect(mockedPigpio.event_callback).toBeCalledWith(1, expect.anything())
    expect(mockedPigpio.event_callback).toBeCalledWith(2, expect.anything())
    expect(mockedPigpio.event_callback).toBeCalledWith(3, expect.anything())
    expect(mockedPigpio.event_callback).lastCalledWith(14, expect.anything())
    // invoke callback
    const func = asMock(mockedPigpio.event_callback).mock.calls[0][1] as (event: number, tick: number) => void
    func(0, 3)
    expect(listener).toHaveBeenCalledTimes(1)

    pig.event.off('EVENT0', listener)
    expect(mockedEven.cancel).toHaveBeenCalledTimes(1)
    pig.event.off('EVENT1', listener)
    expect(mockedEven.cancel).toHaveBeenCalledTimes(2)
    pig.event.off('EVENT1', listener)
    expect(mockedEven.cancel).toHaveBeenCalledTimes(2)
    pig.event.off('EVENT3', listener)
    expect(mockedEven.cancel).toHaveBeenCalledTimes(3)
    pig.event.off('EVENT6', listener)
    expect(mockedEven.cancel).toHaveBeenCalledTimes(3)
    await pig.close()
})

test('events once', async () => {
    const pig = await pigpio('test', 333, true)

    const mockedEven = {
        cancel: jest.fn()
    }
    asMock(mockedPigpio.event_callback).mockReturnValue(mockedEven)

    const listener = jest.fn()
    pig.event.once('EVENT0', listener)

    // invoke callback
    const func = asMock(mockedPigpio.event_callback).mock.calls[0][1] as (event: number, tick: number) => void
    func(0, 3)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(mockedEven.cancel).toHaveBeenCalledTimes(1)
    await pig.close()
})
