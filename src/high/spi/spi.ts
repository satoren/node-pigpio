import { MonoTypedEventEmitter } from '../../utils/TypedEventEmitter'
import { Spi } from '../../types'
import { pigpio as llpigpio } from '../../lowlevel'

class SpiImpl implements Spi {
    private handle?: number;
    private pi: llpigpio
    readonly closeEvent = new MonoTypedEventEmitter<void>()

    constructor (
        pi: llpigpio
    ) {
        this.pi = pi
    }

    async open (channel: number, baud: number, flags: number) {
        this.handle = await this.pi.spi_open(channel, baud, flags)
    }

    async writeDevice (data: Buffer): Promise<void> {
        const { handle } = this
        if (handle == null) {
            throw new Error('Invalid Handle')
        }
        await this.pi.spi_write(handle, data)
    }

    async readDevice (count: number): Promise<Buffer> {
        const { handle } = this
        if (count <= 0) {
            throw new Error('Invalid Argument')
        }
        if (handle == null) {
            throw new Error('Invalid Handle')
        }
        const [, data] = await this.pi.spi_read(handle, count)

        if (data.length === 0) {
            throw new Error('Cant readDevice: Unknown reason')
        }
        return data
    }

    async xferDevice (data: Buffer): Promise<Buffer | undefined> {
        const { handle } = this
        if (data.length === 0) {
            throw new Error('Invalid Argument')
        }
        if (handle == null) {
            throw new Error('Invalid Handle')
        }
        const [, d] = await this.pi.spi_xfer(handle, data)

        return d
    }

    async close (): Promise<void> {
        const { handle } = this
        if (handle == null) {
            throw new Error('Invalid Handle')
        }
        await this.pi.spi_close(handle)
        this.handle = undefined
        await this.closeEvent.emit()
    }
}
export class SpiFactory {
    private instances: Set<SpiImpl> = new Set()
    private pi: llpigpio

    constructor (pi: llpigpio) {
        this.pi = pi
    }

    create = async (
        channel: number,
        baudRate: number,
        flags: number
    ): Promise<Spi> => {
        const spi = new SpiImpl(this.pi)
        this.instances.add(spi)
        await spi.open(channel, baudRate, flags)
        spi.closeEvent.once(() => {
            this.instances.delete(spi)
        })
        return spi
    }

    close = async (): Promise<void> => {
        const instances = [...this.instances.values()]
        await Promise.all([...instances.map(v => v.close())])
    }
}
export default { SpiFactory }
