import {
  Pigpio,
  BBI2COption,
  I2COption,
  I2c,
  defaultFactory,
} from '@node-pigpio/highlevel'

import { dithering } from './ImageUtil/grayscale'
import { isImageData, ImageData } from './type'

interface DeviceInterface {
  data(data: Uint8Array): Promise<void>
  command(data: Uint8Array): Promise<void>
  close(): Promise<void>
}

const defaultWidth = 128
const defaultHeight = 64

enum Commands {
  Contrast = 0x81,
  EntireOn = 0xa4,
  NormInv = 0xa6,
  Disp = 0xae,
  MemAddr = 0x20,
  ColAddr = 0x21,
  PageAddr = 0x22,
  DispStartLine = 0x40,
  SegRemap = 0xa0,
  MuxRatio = 0xa8,
  ComOutDir = 0xc0,
  DispOffset = 0xd3,
  ComPinCfg = 0xda,
  DispClkDiv = 0xd5,
  Precharge = 0xd9,
  VcomDesel = 0xdb,
  ChargePump = 0x8d,
}

const settings: Record<
  string,
  { multiplex: number; displayclockdiv: number; compins: number }
> = {
  '128x64': { multiplex: 0x3f, displayclockdiv: 0x80, compins: 0x12 },
  '128x32': { multiplex: 0x1f, displayclockdiv: 0x80, compins: 0x02 },
  '96x16': { multiplex: 0x0f, displayclockdiv: 0x60, compins: 0x02 },
  '64x48': { multiplex: 0x2f, displayclockdiv: 0x80, compins: 0x12 },
  '64x32': { multiplex: 0x1f, displayclockdiv: 0x80, compins: 0x12 },
}

const swapPage = (page: Uint8Array): Uint8Array => {
  const pageSize = page.length
  const srcWidth = (pageSize / 8) | 0

  const buffer = new Uint8Array(pageSize)

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < pageSize; x += 1) {
      const srcPos = ((x / 8) | 0) + y * srcWidth
      const srcBit = x % 8
      const p = (page[srcPos] >> srcBit) & 1

      const destPos = x
      const destBit = y
      buffer[destPos] |= p << destBit
    }
  }

  return buffer
}

const createDeviceInterface = (i2c: I2c): Promise<DeviceInterface> => {
  return new Promise<DeviceInterface>((resolve) =>
    resolve({
      data: async (data: Uint8Array): Promise<void> => {
        await i2c.writeDevice(data)
      },
      command: async (data: Uint8Array): Promise<void> => {
        await i2c.writeDevice(Uint8Array.from([0x0, ...data]))
      },
      close: async (): Promise<void> => {
        await i2c.close()
      },
    })
  )
}
export interface Ssd1306OpenOption {
  i2cOption?: I2COption | BBI2COption
  gpio?: Pigpio
  width?: number
  height?: number
}
export class Ssd1306 {
  private device: DeviceInterface
  readonly width: number = defaultWidth
  readonly height: number = defaultHeight
  constructor(
    device: DeviceInterface,
    width: number = defaultWidth,
    height: number = defaultHeight
  ) {
    this.device = device
    this.width = width
    this.height = height
  }

  static async openDevice(option?: Ssd1306OpenOption): Promise<Ssd1306> {
    const {
      i2cOption = { bus: 1, address: 0x3c },
      gpio,
      width = defaultWidth,
      height = defaultHeight,
    } = option ?? {}
    const gpioif = gpio ?? (await defaultFactory.get())
    const display = new Ssd1306(
      await createDeviceInterface(await gpioif.i2c(i2cOption)),
      width,
      height
    )
    await display.init()
    return display
  }

  async init(): Promise<void> {
    const setting = settings[`${this.width}x${this.height}`]
    if (!setting) {
      throw Error(`Resolution is not supported:${this.width}x${this.height}`)
    }

    await this.device.command(
      Uint8Array.from([
        Commands.Disp,
        Commands.MuxRatio,
        setting.multiplex,
        Commands.DispOffset,
        0x00,
        Commands.DispStartLine,
        Commands.SegRemap | 1,
        Commands.ComOutDir | 8,
        Commands.ComPinCfg,
        setting.compins,
        Commands.Contrast,
        0x7f,
        Commands.EntireOn,
        Commands.NormInv,
        Commands.DispClkDiv,
        setting.displayclockdiv,
        Commands.MemAddr,
        0b00,
        Commands.PageAddr,
        0,
        7,
        Commands.ColAddr,
        0,
        127,
        Commands.ChargePump,
        0x14,
        Commands.VcomDesel,
        0x40,
        Commands.Disp | 1,
      ])
    )
  }

  async display(on: boolean): Promise<void> {
    await this.device.command(Uint8Array.from([Commands.Disp | (on ? 1 : 0)]))
  }

  async contrast(contrast: number): Promise<void> {
    await this.device.command(Uint8Array.from([Commands.Contrast, contrast]))
  }

  async invert(invert: boolean): Promise<void> {
    await this.device.command(
      Uint8Array.from([Commands.NormInv | (invert ? 1 : 0)])
    )
  }

  async draw(data: Uint8Array | ImageData): Promise<void> {
    if (isImageData(data)) {
      if (data.format !== 'A1') {
        data = Uint8Array.from(dithering(data).data)
      } else {
        data = Uint8Array.from(data.data)
      }
    }

    const bufferSize = (this.width * this.height) / 8
    if (data.length !== bufferSize) {
      throw Error('Invalid buffer: Require A1 format')
    }

    const buffer = new Uint8Array(bufferSize)
    const pageSize = this.width
    for (let p = 0; p < data.length; p += pageSize) {
      const srcPage = data.slice(p, p + pageSize)
      const page = swapPage(srcPage)
      buffer.set(page, p)
    }
    await this.device.data(Uint8Array.from([0b01000000, ...buffer]))
  }

  requireFormat = 'A1'

  async close(): Promise<void> {
    await this.display(false)
    await this.device.close()
  }
}

export default Ssd1306
