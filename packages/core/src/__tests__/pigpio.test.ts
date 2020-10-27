/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as pigpio from '../pigpio'
import RequestCommand from '../command/RequestCommands'

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
jest.mock('../RequestSocket', () => ({
    createRequestSocket: () => mockRequestSocket
}))
jest.mock('../NotifySocket', () => ({
    createNotifySocket: () => mockNotifySocket
}))

let pi: pigpio.pigpio
beforeEach(async () => {
    pi = await pigpio.pi()
    jest.clearAllMocks()
})
test('tickDiff', () => {
    expect(pigpio.tickDiff(4294967272, 12)).toBe(36)
})

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

describe('bb spi', () => {
    test('open and close', async () => {
        await pi.bb_spi_open(cs, miso, mosi, sclk, baudrate, flags)
        const extent = toBuffer(miso, mosi, sclk, baudrate, flags)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.BSPIO.cmdNo, extension: extent, p1: cs, p2: 0, responseExtension: false })
        mockRequestSocket.request.mockClear()
        await pi.bb_spi_close(cs)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.BSPIC.cmdNo, p1: cs, p2: 0, responseExtension: false })
    })

    test('xfer', async () => {
        mockRequestSocket.request.mockClear()
        const writeData = Buffer.of(21)

        const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
        mockRequestSocket.request.mockResolvedValueOnce({ cmd: RequestCommand.BSPIX.cmdNo, p1: cs, p2: 0, res: responseData.length, extension: responseData })
        const [, readData] = await pi.bb_spi_xfer(cs, writeData)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.BSPIX.cmdNo, extension: writeData, p1: cs, p2: 0, responseExtension: true })
        expect(readData).toMatchObject(responseData)
    })
})

describe('gpio', () => {
    test('on EITHER_EDGE', () => {
        const listener = jest.fn()
        pi.callback(3, pigpio.EITHER_EDGE, listener)
        expect(mockNotifySocket.append).toBeCalledWith({ bit: 8, edge: 2, gpio: 3, func: expect.anything() })
    })
    test('on rising edge', () => {
        const listener = jest.fn()
        pi.callback(3, pigpio.RISING_EDGE, listener)
        expect(mockNotifySocket.append).toBeCalledWith({ bit: 8, edge: 0, gpio: 3, func: expect.anything() })
    })
    test('on falling edge', () => {
        const listener = jest.fn()
        pi.callback(2, pigpio.FALLING_EDGE, listener)
        expect(mockNotifySocket.append).toBeCalledWith({ bit: 4, edge: 1, gpio: 2, func: expect.anything() })

        // invoke callback
        const func = mockNotifySocket.append.mock.calls[0][0].func as (gpio: number, level: 0 | 1 | 'TIMEOUT', tick: number) => void
        func(2, 1, 3)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    test('write', async () => {
        await pi.write(3, 1)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.WRITE.cmdNo, p1: 3, p2: 1, responseExtension: false })
    })

    test('read', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.READ.cmdNo, p1: 3, p2: 0, res: 1 }))
        const v = await pi.read(3)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.READ.cmdNo, p1: 3, p2: 0, responseExtension: false })
        expect(v).toBe(1)
    })
    test.each([
        [1],
        [0]
    ] as const)('setMode', async (mode) => {
        await pi.set_mode(3, mode)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.MODES.cmdNo, p1: 3, p2: mode, responseExtension: false })
    })

    test.each([
        [1],
        [0]
    ] as const)('getMode', async (mode) => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.MODEG.cmdNo, p1: 3, p2: 0, res: mode }))
        const v = await pi.get_mode(3)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.MODEG.cmdNo, p1: 3, p2: 0, responseExtension: false })
        expect(v).toBe(mode)
    })

    test.each([
        [0],
        [1],
        [2]
    ] as const)('setPullUpDown %s', async (mode) => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PUD.cmdNo, p1: 3, p2: mode, res: 1 }))
        await pi.set_pull_up_down(3, mode)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PUD.cmdNo, p1: 3, p2: mode, responseExtension: false })
    })
    test('setPullUpDown with error argument', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PUD.cmdNo, p1: 3, p2: 433, res: -2 }))
        const ret = pi.set_pull_up_down(3, 433)
        await expect(ret).rejects.toThrowError()
    })

    test('setServoPulsewidth', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.SERVO.cmdNo, p1: 3, p2: 222, res: 1 }))
        await pi.set_servo_pulsewidth(3, 222)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.SERVO.cmdNo, p1: 3, p2: 222, responseExtension: false })
    })

    test('getServoPulsewidth', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.GPW.cmdNo, p1: 3, p2: 0, res: 333 }))
        const r = await pi.get_servo_pulsewidth(3)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.GPW.cmdNo, p1: 3, p2: 0, responseExtension: false })
        expect(r).toBe(333)
    })

    test('setPWMFrequency', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PFS.cmdNo, p1: 3, p2: 222, res: 1 }))
        await pi.set_PWM_frequency(3, 222)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PFS.cmdNo, p1: 3, p2: 222, responseExtension: false })
    })

    test('getPWMFrequency', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PFG.cmdNo, p1: 3, p2: 0, res: 333 }))
        const r = await pi.get_PWM_frequency(3)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PFG.cmdNo, p1: 3, p2: 0, responseExtension: false })
        expect(r).toBe(333)
    })

    test('setPWMDutycycle', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PWM.cmdNo, p1: 3, p2: 222, res: 1 }))
        await pi.set_PWM_dutycycle(3, 222)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PWM.cmdNo, p1: 3, p2: 222, responseExtension: false })
    })

    test('getPWMFrequency', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.GDC.cmdNo, p1: 3, p2: 0, res: 333 }))
        const r = await pi.get_PWM_dutycycle(3)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.GDC.cmdNo, p1: 3, p2: 0, responseExtension: false })
        expect(r).toBe(333)
    })

    test('setPWMRange', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PRS.cmdNo, p1: 3, p2: 222, res: 1 }))
        await pi.set_PWM_range(3, 222)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PRS.cmdNo, p1: 3, p2: 222, responseExtension: false })
    })

    test('getPWMRange', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PRG.cmdNo, p1: 3, p2: 0, res: 333 }))
        const r = await pi.get_PWM_range(3)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PRG.cmdNo, p1: 3, p2: 0, responseExtension: false })
        expect(r).toBe(333)
    })
    test('getPWMRealRange', async () => {
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.PRRG.cmdNo, p1: 3, p2: 0, res: 333 }))
        const r = await pi.get_PWM_real_range(3)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.PRRG.cmdNo, p1: 3, p2: 0, responseExtension: false })
        expect(r).toBe(333)
    })
})

describe('i2c', () => {
    test('open ', async () => {
        const bus = 1
        const address = 0x73
        const flags = 3
        const i2chandle = 99
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.I2CO.cmdNo, p1: bus, p2: address, res: i2chandle }))
        const i2c = await pi.i2c_open(bus, address, flags)
        expect(i2c).toBe(i2c)

        const flag = Buffer.alloc(4)
        flag.writeUInt32LE(flags)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CO.cmdNo, extension: flag, p1: bus, p2: address, responseExtension: false })
    })
    test('close', async () => {
        const i2chandle = 99
        await pi.i2c_close(i2chandle)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CC.cmdNo, p1: i2chandle, p2: 0, responseExtension: false })
    })

    test('write_device', async () => {
        const i2chandle = 99
        const writeData = Buffer.of(21)
        await pi.i2c_write_device(i2chandle, writeData)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CWD.cmdNo, p1: i2chandle, p2: 0, extension: writeData, responseExtension: false })
    })

    test('read', async () => {
        const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
        const i2chandle = 99
        mockRequestSocket.request.mockResolvedValueOnce({ cmd: RequestCommand.I2CRD.cmdNo, p1: i2chandle, p2: 0, res: responseData.length, extension: responseData })
        const [s, readData] = await pi.i2c_read_device(i2chandle, responseData.length)
        expect(s).toBe(readData.length)

        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CRD.cmdNo, p1: i2chandle, p2: responseData.length, responseExtension: true })
        expect(readData).toMatchObject(responseData)
    })

    test('zip', async () => {
        const responseData = Buffer.of(1, 2, 3, 4, 6, 7, 8, 12, 32, 56)
        const i2chandle = 99
        mockRequestSocket.request.mockResolvedValueOnce({ cmd: RequestCommand.BI2CZ.cmdNo, p1: i2chandle, p2: 0, res: responseData.length, extension: responseData })
        const commands = Buffer.of(7, 1, 21, 6, 10, 0)
        const [s, readData] = await pi.i2c_zip(i2chandle, commands)
        expect(s).toBe(responseData.length)

        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.I2CZ.cmdNo, p1: i2chandle, p2: 0, responseExtension: true, extension: commands })
        expect(readData).toMatchObject(responseData)
    })
})

describe('bb i2c', () => {
    const sda = 17
    const scl = 27
    const baudrate = 100000
    test('open', async () => {
        await pi.bb_i2c_open(sda, scl, baudrate)
        const baud = Buffer.alloc(4)
        baud.writeUInt32LE(baudrate)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CO.cmdNo, extension: baud, p1: sda, p2: scl, responseExtension: false })
        mockRequestSocket.request.mockClear()
    })

    test('close', async () => {
        const sda = 4
        await pi.bb_i2c_close(sda)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CC.cmdNo, p1: sda, p2: 0, responseExtension: false })
    })

    test('zip', async () => {
        const responseData = Buffer.of(4, 5, 6, 7, 42)
        mockRequestSocket.request.mockResolvedValueOnce(({ cmd: RequestCommand.BI2CZ.cmdNo, p1: sda, p2: 0, res: responseData.length, extension: responseData }))
        const zipCommand = Buffer.of(4, sda, 2, 6, 4, 3, 0)
        await pi.bb_i2c_zip(sda, zipCommand)
        expect(mockRequestSocket.request).toBeCalledWith({ cmd: RequestCommand.BI2CZ.cmdNo, extension: zipCommand, p1: sda, p2: 0, responseExtension: true })
    })
})
