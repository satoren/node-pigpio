import { MonoTypedEventEmitter } from '@node-pigpio/util'
import * as pigpio from '@node-pigpio/core'
import { Spi } from '../types'

class SpiImpl implements Spi {
    private CS: number
    private pi: pigpio.pigpio
    readonly closeEvent = new MonoTypedEventEmitter<void>()
    constructor (
        CS: number,
        pi: pigpio.pigpio
    ) {
        this.CS = CS
        this.pi = pi
    }

    async open (
        miso: number,
        mosi: number,
        sclk: number,
        baudRate: number,
        flags: number
    ) {
        const { CS } = this

        await this.pi.bb_spi_open(CS, miso, mosi, sclk, baudRate, flags)
    }

    async writeDevice (data: Buffer): Promise<void> {
        await this.xferDevice(data)
    }

    async readDevice (count: number): Promise<Buffer> {
        const data = await this.xferDevice(Buffer.alloc(count))
        if (!data) {
            throw new Error('Cant readDevice: Unknown reason')
        }
        return data
    }

    async xferDevice (data: Buffer): Promise<Buffer | undefined> {
        const { CS } = this
        if (data.length === 0) {
            throw new Error('Invalid Argument')
        }
        const [, d] = await this.pi.bb_spi_xfer(CS, data)
        return d
    }

    async close (): Promise<void> {
        const { CS } = this
        await this.pi.bb_spi_close(CS)
        await this.closeEvent.emit()
    }
}

export class BBSpiFactory {
    private pi: pigpio.pigpio

    constructor (pi: pigpio.pigpio) {
        this.pi = pi
    }

    create = async (
        cs: number,
        miso: number,
        mosi: number,
        sclk: number,
        baudRate: number,
        flags: number
    ): Promise<Spi> => {
        const spi = new SpiImpl(cs, this.pi)
        await spi.open(miso, mosi, sclk, baudRate, flags)
        return spi
    }
}
export default { BBSpiFactory }
