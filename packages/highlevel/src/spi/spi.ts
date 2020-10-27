import { MonoTypedEventEmitter } from '@node-pigpio/util'
import { Spi } from '../types'
import * as pigpio from '@node-pigpio/core'

class SpiImpl implements Spi {
    private handle?: number;
    private pi: pigpio.pigpio
    readonly closeEvent = new MonoTypedEventEmitter<void>()

    constructor (
        pi: pigpio.pigpio
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
    private pi: pigpio.pigpio

    constructor (pi: pigpio.pigpio) {
        this.pi = pi
    }

    create = async (
        channel: number,
        baudRate: number,
        flags: number
    ): Promise<Spi> => {
        const spi = new SpiImpl(this.pi)
        await spi.open(channel, baudRate, flags)
        return spi
    }
}
export default { SpiFactory }
