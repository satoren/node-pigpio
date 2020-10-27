import { Pigpio, BBSpiOption, SpiOption, Gpio, Spi } from '@node-pigpio/highlevel'

const defaultWidth = 96 as const
const defaultHeight = 64 as const

enum Commands {
    Disp = 0xae,
    DispStartLine = 0xa1,
    DispOffset = 0xa2,
    SegRemap = 0xa0,
    NormalDisplay = 0xa4,
    SetMultiplex = 0xa8,
    MasterConfigure = 0xad,
    PowerSaveMode = 0xb0,
    Phase12Period = 0xb1,
    ClockDivider = 0xb3,
    SetPrechargeSpeedA = 0x8a,
    SetPrechargeSpeedB = 0x8b,
    SetPrechargeSpeedC = 0x8c,
    SetPrechargeVoltage = 0xbb,
    SetVoltage = 0xbe,
    MasterCurrentControl = 0x87,
    ContrastA = 0x81,
    ContrastB = 0x82,
    ContrastC = 0x83,
    SetColumnAddress = 0x15,
    SetRowAddress = 0x75,

    DrawLine = 0x21,
    DrawRectangle = 0x22,
    FillEnable = 0x26,
}

interface DeviceInterface {
    data(data: Buffer): Promise<void>;
    command(data: Buffer): Promise<void>;
    close(): Promise<void>;
}
interface Point {
    x: number;
    y: number;
}
interface Color {
    r: number;
    g: number;
    b: number;
}

const createDeviceInterface = async (spi: Spi, dc: Gpio): Promise<DeviceInterface> => {
    await dc.setMode('OUTPUT')
    return ({
        data: async (data:Buffer): Promise<void> => {
            await dc.write(1)
            await spi.writeDevice(data)
        },
        command: async (data:Buffer): Promise<void> => {
            await dc.write(0)
            await spi.writeDevice(data)
        },
        close: async ():Promise<void> => {
            dc.close()
            await spi.close()
        }
    })
}

const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec))
export class Ssd1331 {
    private device: DeviceInterface;
    private rs: Gpio;
    readonly width: number;
    readonly height: number;
    constructor (
        device: DeviceInterface,
        rs: Gpio,
        width: typeof defaultWidth = defaultWidth,
        height: typeof defaultHeight = defaultHeight
    ) {
        this.device = device
        this.rs = rs
        this.width = width
        this.height = height
    }

    static async openDevice (
        gpio: Pigpio,
        spiOption: SpiOption | BBSpiOption,
        dc = 24,
        rs = 25,
        width: typeof defaultWidth = defaultWidth,
        height: typeof defaultHeight = defaultHeight
    ): Promise<Ssd1331> {
        const device = await createDeviceInterface(await gpio.spi(spiOption), gpio.gpio(dc))
        return new Ssd1331(device, gpio.gpio(rs), width, height)
    }

    async init (): Promise<void> {
        await this.rs.setMode('OUTPUT')
        await this.rs.write(1)
        await this.rs.write(0)

        await sleep(10)

        await this.rs.write(1)
        await this.device.command(
            Buffer.from([
                Commands.Disp,
                Commands.SegRemap, 0b01110010,
                Commands.DispStartLine, 0,
                Commands.DispOffset, 0,
                Commands.NormalDisplay, Commands.SetMultiplex, 0b00111111,
                Commands.MasterConfigure, 0b1000110,
                Commands.PowerSaveMode, 0b00000000,
                Commands.Phase12Period, 0x74,
                Commands.ClockDivider, 0xF0,
                Commands.SetPrechargeSpeedA, 0x80,
                Commands.SetPrechargeSpeedB, 0x80,
                Commands.SetPrechargeSpeedC, 0x80,
                Commands.SetPrechargeVoltage, 0x3A,
                Commands.SetVoltage, 0x3E,
                Commands.MasterCurrentControl, 0x06,
                Commands.SetColumnAddress, 0, this.width - 1,
                Commands.SetRowAddress, 0, this.height - 1,
                Commands.ContrastA, 200,
                Commands.ContrastB, 200,
                Commands.ContrastC, 200
            ])
        )

        await this.device.command(
            Buffer.from([0xAF])
        )
    }

    async display (on: boolean): Promise<void> {
        await this.device.command(
            Buffer.from([Commands.Disp | (on ? 1 : 0)])
        )
    }

    async contrast (contrast: number): Promise<void> {
        await this.device.command(
            Buffer.from([
                Commands.ContrastA, contrast,
                Commands.ContrastB, contrast,
                Commands.ContrastC, contrast
            ])
        )
    }

    async draw (data: Buffer): Promise<void> {
        const bufferSize = (this.width * this.height) * 2
        if (data.length !== bufferSize) {
            throw Error('Invalid buffer')
        }
        await this.device.command(Buffer.from([
            Commands.SetColumnAddress, 0, this.width - 1,
            Commands.SetRowAddress, 0, this.height - 1
        ]))

        const buf = Buffer.from(data)
        buf.swap16()
        await this.device.data(buf)
    }

    async drawLine (start: Point, end: Point, color: Color): Promise<void> {
        await this.device.command(Buffer.from([
            Commands.DrawLine,
            start.x, start.y,
            end.x, end.y,
            color.b * 0x3f | 0,
            color.g * 0x3f | 0,
            color.r * 0x3f | 0
        ]))
    }

    async drawRectanble (lefttop: Point, rightbottom: Point, outline: Color, fill?: Color): Promise<void> {
        const fillColor = fill ? [fill.b * 0x3f | 0, fill.g * 0x3f | 0, fill.r * 0x3f | 0] : []

        await this.device.command(Buffer.from([
            Commands.FillEnable, fill ? 1 : 0,
            Commands.DrawRectangle,
            lefttop.x, lefttop.y,
            rightbottom.x, rightbottom.y,
            outline.b * 0x3f | 0,
            outline.g * 0x3f | 0,
            outline.r * 0x3f | 0,
            ...fillColor
        ]))
    }

    async close () : Promise<void> {
        this.rs.close()
        await this.device.close()
    }
}

export default Ssd1331
