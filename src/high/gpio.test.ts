/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createGpio } from './gpio'

import RequestCommand from '../lowlevel/command/RequestCommands'
import * as pigpio from '../lowlevel'

const mockRequestSocket = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    request: jest.fn((arg) => ({ ...arg, res: 0 })),
    close: jest.fn()
}
const mockNotifySocket = {
    appendEvent: jest.fn(),
    removeEvent: jest.fn(),
    append: jest.fn(),
    remove: jest.fn(),
    close: jest.fn()
}
jest.mock('../lowlevel/RequestSocket', () => ({
    createRequestSocket: () => mockRequestSocket
}))
jest.mock('../lowlevel/NotifySocket', () => ({
    createNotifySocket: () => mockNotifySocket
}))

let pi:pigpio.pigpio
beforeEach(async () => {
    pi = await pigpio.pi()
    jest.clearAllMocks()
})
test('create', () => {
    const gpio = createGpio(3, pi)
    expect(gpio.pin).toBe(3)
})

test('on edge', () => {
    const gpio = createGpio(3, pi)

    const listener = jest.fn()
    gpio.on('edge', listener)

    expect(mockNotifySocket.append).toHaveBeenCalledTimes(1)
    expect(mockNotifySocket.append.mock.calls[0][0]).toMatchObject({ bit: 8, edge: 2, gpio: 3 })
})
test('on rising edge', () => {
    const gpio = createGpio(1, pi)

    const listener = jest.fn()
    gpio.on('risingEdge', listener)

    expect(mockNotifySocket.append).toHaveBeenCalledTimes(1)
    expect(mockNotifySocket.append.mock.calls[0][0]).toMatchObject({ bit: 2, edge: 0, gpio: 1 })
})
test('on falling edge', () => {
    const gpio = createGpio(2, pi)

    const listener = jest.fn()
    gpio.on('fallingEdge', listener)

    expect(mockNotifySocket.append).toHaveBeenCalledTimes(1)
    expect(mockNotifySocket.append.mock.calls[0][0]).toMatchObject({ bit: 4, edge: 1, gpio: 2 })

    // invoke callback
    const func = mockNotifySocket.append.mock.calls[0][0].func as (gpio: number, level: 0 | 1 | 'TIMEOUT', tick: number) => void
    func(2, 1, 3)
    expect(listener).toHaveBeenCalledTimes(1)
})
test('once edge', () => {
    const gpio = createGpio(2, pi)

    const listener = jest.fn()
    gpio.once('edge', listener)

    expect(mockNotifySocket.append).toHaveBeenCalledTimes(1)
    expect(mockNotifySocket.append.mock.calls[0][0]).toMatchObject({ bit: 4, edge: 2, gpio: 2 })

    // invoke callback
    const func = mockNotifySocket.append.mock.calls[0][0].func as (gpio: number, level: 0 | 1 | 'TIMEOUT', tick: number) => void
    func(2, 1, 3)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(mockNotifySocket.remove).toHaveBeenCalledTimes(1)
})
test('on/off notify edge', () => {
    const gpio = createGpio(3, pi)

    const listener = jest.fn()
    gpio.on('edge', listener)
    // invoke callback
    const func = mockNotifySocket.append.mock.calls[0][0].func as (gpio: number, level: 0 | 1 | 'TIMEOUT', tick: number) => void
    func(2, 1, 3)
    expect(listener).toHaveBeenCalledTimes(1)

    gpio.off('edge', listener)
    expect(mockNotifySocket.remove).toHaveBeenCalledTimes(1)
})
test('add/removeListener notify edge', () => {
    const gpio = createGpio(3, pi)

    const listener = jest.fn()
    gpio.addListener('edge', listener)
    // invoke callback
    const func = mockNotifySocket.append.mock.calls[0][0].func as (gpio: number, level: 0 | 1 | 'TIMEOUT', tick: number) => void
    func(2, 1, 3)
    expect(listener).toHaveBeenCalledTimes(1)

    gpio.removeListener('edge', listener)
    expect(mockNotifySocket.remove).toHaveBeenCalledTimes(1)
})

test('write', async () => {
    const gpio = createGpio(3, pi)
    await gpio.write(1)
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.WRITE.cmdNo, p1: 3, p2: 1, responseExtension: false })
})

test('read', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.READ.cmdNo, p1: 3, p2: 0, res: 1 }))
    const v = await gpio.read()
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.READ.cmdNo, p1: 3, p2: 0, responseExtension: false })
    expect(v).toBe(1)
})

test.each([
    ['OUTPUT', 1],
    ['INPUT', 0]
] as const)('setMode', async (mode, value) => {
    const gpio = createGpio(3, pi)
    await gpio.setMode(mode)
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.MODES.cmdNo, p1: 3, p2: value, responseExtension: false })
})

test.each([
    ['OUTPUT', 1],
    ['INPUT', 0]
] as const)('getMode', async (mode, value) => {
    const gpio = createGpio(3, pi)
    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.MODEG.cmdNo, p1: 3, p2: 0, res: value }))
    const v = await gpio.getMode()
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.MODEG.cmdNo, p1: 3, p2: 0, responseExtension: false })
    expect(v).toBe(mode)
})

test.each([
    ['OFF', 0],
    ['DOWN', 1],
    ['UP', 2]
] as const)('setPullUpDown %s', async (mode, value) => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PUD.cmdNo, p1: 3, p2: value, res: 1 }))
    await gpio.setPullUpDown(mode)
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PUD.cmdNo, p1: 3, p2: value, responseExtension: false })
})

test('setServoPulsewidth', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.SERVO.cmdNo, p1: 3, p2: 222, res: 1 }))
    await gpio.setServoPulsewidth(222)
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.SERVO.cmdNo, p1: 3, p2: 222, responseExtension: false })
})

test('getServoPulsewidth', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.GPW.cmdNo, p1: 3, p2: 0, res: 333 }))
    const r = await gpio.getServoPulsewidth()
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.GPW.cmdNo, p1: 3, p2: 0, responseExtension: false })
    expect(r).toBe(333)
})

test('setPWMFrequency', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PFS.cmdNo, p1: 3, p2: 222, res: 1 }))
    await gpio.setPWMFrequency(222)
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PFS.cmdNo, p1: 3, p2: 222, responseExtension: false })
})

test('getPWMFrequency', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PFG.cmdNo, p1: 3, p2: 0, res: 333 }))
    const r = await gpio.getPWMFrequency()
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PFG.cmdNo, p1: 3, p2: 0, responseExtension: false })
    expect(r).toBe(333)
})

test('setPWMDutycycle', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PWM.cmdNo, p1: 3, p2: 222, res: 1 }))
    await gpio.setPWMDutycycle(222)
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PWM.cmdNo, p1: 3, p2: 222, responseExtension: false })
})

test('getPWMFrequency', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.GDC.cmdNo, p1: 3, p2: 0, res: 333 }))
    const r = await gpio.getPWMDutycycle()
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.GDC.cmdNo, p1: 3, p2: 0, responseExtension: false })
    expect(r).toBe(333)
})

test('setPWMRange', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PRS.cmdNo, p1: 3, p2: 222, res: 1 }))
    await gpio.setPWMRange(222)
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PRS.cmdNo, p1: 3, p2: 222, responseExtension: false })
})

test('getPWMRange', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PRG.cmdNo, p1: 3, p2: 0, res: 333 }))
    const r = await gpio.getPWMRange()
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PRG.cmdNo, p1: 3, p2: 0, responseExtension: false })
    expect(r).toBe(333)
})
test('getPWMRealRange', async () => {
    const gpio = createGpio(3, pi)

    mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PRRG.cmdNo, p1: 3, p2: 0, res: 333 }))
    const r = await gpio.getPWMRealRange()
    expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PRRG.cmdNo, p1: 3, p2: 0, responseExtension: false })
    expect(r).toBe(333)
})
