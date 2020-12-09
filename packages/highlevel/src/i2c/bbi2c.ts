import { MonoTypedEventEmitter } from '@node-pigpio/util'
import { I2c, I2cZipCommand } from '../types'
import { buildZipCommand, ZipCommand } from './zipCommand'
import { flat } from '../util'
import * as pigpio from '@node-pigpio/core'

class BBI2cImpl implements I2c {
  private device: number
  private sda: number
  private pi: pigpio.pigpio
  readonly closeEvent = new MonoTypedEventEmitter<void>()
  constructor(device: number, sda: number, pi: pigpio.pigpio) {
    this.device = device
    this.sda = sda
    this.pi = pi
  }

  async writeDevice(data: Uint8Array): Promise<void> {
    await this.zip({ type: 'Write', data })
  }

  async readDevice(count: number): Promise<Uint8Array> {
    const read = await this.zip({ type: 'Read', size: count })
    return read[0]
  }

  async zip(...commands: I2cZipCommand[]): Promise<Uint8Array[]> {
    const { sda, device } = this
    const data = Uint8Array.of(
      ZipCommand.Address,
      device,
      ...flat(commands.map((c) => buildZipCommand(c, true))),
      ZipCommand.Stop,
      ZipCommand.End
    )
    const [, res] = await this.pi.bb_i2c_zip(sda, data)
    const ret: Uint8Array[] = []
    let added = 0
    commands.forEach((r) => {
      if (r.type === 'Read') {
        ret.push(res.slice(added, added + r.size))
        added += r.size
      }
    })
    return ret
  }

  async close(): Promise<void> {
    await this.closeEvent.emit()
  }
}

class BBI2cIf {
  private pi: pigpio.pigpio
  private instances: Set<BBI2cImpl> = new Set()
  closed = false

  constructor(
    readonly sda: number,
    readonly scl: number,
    readonly baud: number,
    pi: pigpio.pigpio
  ) {
    this.pi = pi
  }

  async open() {
    const { sda, scl, baud } = this
    await this.pi.bb_i2c_open(sda, scl, baud)
  }

  create = (device: number): I2c => {
    const i2c = new BBI2cImpl(device, this.sda, this.pi)
    this.instances.add(i2c)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    i2c.closeEvent.once(() => this.closedDevice(i2c))
    return i2c
  }

  async closedDevice(device: BBI2cImpl): Promise<void> {
    if (!this.instances.has(device)) {
      return
    }
    this.instances.delete(device)
    if (this.instances.size === 0) {
      await this.close()
    }
  }

  async close(): Promise<void> {
    this.closed = true
    const { sda } = this
    const close = Promise.all(
      Array.of(...this.instances.values()).map((i) => i.close())
    )
    this.instances.clear()
    await close
    await this.pi.bb_i2c_close(sda)
  }
}

export class BBI2cFactory {
  private instances = new Map<number, BBI2cIf>()
  private pi: pigpio.pigpio

  constructor(pi: pigpio.pigpio) {
    this.pi = pi
  }

  async getInterface(sda: number, scl: number, baud: number): Promise<BBI2cIf> {
    const i2cif = this.instances.get(sda)
    if (i2cif && !i2cif.closed) {
      if (scl !== i2cif.scl) {
        throw Error(
          `Invalid scl pin: ${scl} is different with opened ${i2cif.scl}`
        )
      }
      if (baud !== i2cif.baud) {
        throw Error(
          `Invalid baudrate: ${baud} is different with opened ${i2cif.baud}`
        )
      }
      return i2cif
    }

    const i2c = new BBI2cIf(sda, scl, baud, this.pi)
    this.instances.set(sda, i2c)
    await i2c.open()
    return i2c
  }

  async create(
    device: number,
    sda: number,
    scl: number,
    baud: number
  ): Promise<I2c> {
    const i2c = await this.getInterface(sda, scl, baud)
    return i2c.create(device)
  }
}
export default { BBI2cFactory }
