import { MonoTypedEventEmitter } from '@node-pigpio/util'
import { I2c, I2cZipCommand } from '../types'
import { buildZipCommand, ZipCommand } from './zipCommand'
import * as pigpio from '@node-pigpio/core'

class I2cImpl implements I2c {
  private handle?: number
  private pi: pigpio.pigpio
  readonly closeEvent = new MonoTypedEventEmitter<void>()

  constructor(pi: pigpio.pigpio) {
    this.pi = pi
  }

  async open(bus: number, device: number, flags?: number) {
    this.handle = await this.pi.i2c_open(bus, device, flags)
  }

  async writeDevice(data: Buffer): Promise<void> {
    const { handle } = this
    if (handle == null) {
      throw new Error('Invalid Handle')
    }
    await this.pi.i2c_write_device(handle, data)
  }

  async readDevice(count: number): Promise<Buffer> {
    const { handle } = this
    if (count === 0) {
      throw new Error('Invalid Argument')
    }
    if (handle == null) {
      throw new Error('Invalid Handle')
    }

    const [, data] = await this.pi.i2c_read_device(handle, count)
    if (data.length === 0) {
      throw new Error('Cant readDevice: Unknown reason')
    }
    return data
  }

  async zip(...commands: I2cZipCommand[]): Promise<Buffer[]> {
    const { handle } = this
    if (handle == null) {
      throw new Error('Invalid Handle')
    }
    const data = Buffer.concat([
      ...commands.map((c) => buildZipCommand(c, false)),
      Buffer.of(ZipCommand.End),
    ])

    const [, retextension] = await this.pi.i2c_zip(handle, data)

    if (retextension) {
      const ret: Buffer[] = []
      let added = 0
      commands.forEach((r) => {
        if (r.type === 'Read') {
          ret.push(retextension.slice(added, added + r.size))
          added += r.size
        }
      })
      return ret
    }
    return []
  }

  async close(): Promise<void> {
    const { handle } = this
    if (handle == null) {
      throw new Error('Invalid Handle')
    }
    await this.pi.i2c_close(handle)
    this.handle = undefined
    await this.closeEvent.emit()
  }
}

export class I2cFactory {
  private pi: pigpio.pigpio

  constructor(pi: pigpio.pigpio) {
    this.pi = pi
  }

  create = async (bus: number, addr: number, flags?: number): Promise<I2c> => {
    const i2c = new I2cImpl(this.pi)
    await i2c.open(bus, addr, flags)
    return i2c
  }
}
export default { I2cFactory }
