import { MonoTypedEventEmitter } from '../../utils/TypedEventEmitter'
import { I2c, I2cZipCommand } from '../../types'
import { buildZipCommand, ZipCommand } from './zipCommand'
import { pigpio as llpigpio } from '../../lowlevel'

class I2cImpl implements I2c {
    private handle?: number;
    private pi: llpigpio
    readonly closeEvent = new MonoTypedEventEmitter<void>()

    constructor (
        pi: llpigpio
    ) {
        this.pi = pi
    }

    async open (bus: number, device: number, flags?: number) {
        this.handle = await this.pi.i2c_open(bus, device, flags)
    }

    async writeDevice (data: Buffer): Promise<void> {
        const { handle } = this
        if (handle == null) {
            throw new Error('Invalid Handle')
        }
        await this.pi.i2c_write_device(handle, data)
    }

    async readDevice (count: number): Promise<Buffer> {
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

    async zip (...commands: I2cZipCommand[]): Promise<Buffer[]> {
        const { handle } = this
        if (handle == null) {
            throw new Error('Invalid Handle')
        }
        const data = Buffer.concat([
            ...commands.map((c) => buildZipCommand(c, false)),
            Buffer.of(ZipCommand.End)
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

    async close (): Promise<void> {
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
    private instances: Set<I2cImpl> = new Set()
    private pi: llpigpio

    constructor (pi: llpigpio) {
        this.pi = pi
    }

    create = async (
        bus: number,
        addr: number,
        flags?: number
    ): Promise<I2c> => {
        const i2c = new I2cImpl(this.pi)
        this.instances.add(i2c)
        await i2c.open(bus, addr, flags)
        i2c.closeEvent.once(() => { this.instances.delete(i2c) })
        return i2c
    }

    close = async (): Promise<void> => {
        const instances = [...this.instances.values()]
        const closes = instances.map(v => v.close())
        await Promise.all(closes)
    }
}
export default { I2cFactory }
