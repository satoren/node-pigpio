import { EventEmitter } from 'events'
import { pigpio as llpigpio } from '../../lowlevel'
import { Spi } from '../../types'

class SpiImpl extends EventEmitter implements Spi {
    constructor (
        private CS: number,
        private pi: llpigpio
    ) {
        super()
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
        this.emit('close')
    }
}

export class BBSpiFactory {
    private instances: Set<SpiImpl> = new Set()
    private pi: llpigpio

    constructor (pi: llpigpio) {
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
        this.instances.add(spi)
        await spi.open(miso, mosi, sclk, baudRate, flags)
        spi.once('close', () => {
            this.instances.delete(spi)
        })
        return spi
    }

    close = async (): Promise<void> => {
        const instances = [...this.instances.values()]
        await Promise.all([...instances.map(v => v.close())])
    }
}
export default { BBSpiFactory }
