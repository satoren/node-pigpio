
import { EventEmitter } from 'events'

export class Socket extends EventEmitter {
    constructor () {
        super()
        const closeHandler = () => {
            this.socketEnded = true
            this.wake?.()
        }
        this.on('close', closeHandler)

        const dataHandler = (data: Buffer) => {
            this.putReadData(data)
        }
        this.on('data', dataHandler)
        const errorHandler = (error: Error) => {
            this.error = error
            this.wake?.()
        }
        this.on('error', errorHandler)
    }

    reqiestedData:Buffer[] = []
    error?: Error
    wake?: ()=>void
    putReadData (data:Buffer): void {
        this.reqiestedData.push(data)
        this.wake?.()
    }

    socketEnded = false
    connect = jest.fn(() => {
        setImmediate(() => {
            this.emit('connect', {})
        })
    });

    write = jest.fn((data:Buffer) => {
        setImmediate(() => {
            this.emit('data', data)
        })
    });

    setNoDelay = jest.fn();
    destroy = jest.fn();

    [Symbol.asyncIterator] = jest.fn(() => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        return (async function * (): AsyncIterableIterator<Buffer> {
            while (true) {
                if (self.socketEnded) { break }
                if (self.error) { throw self.error }
                if (self.reqiestedData.length === 0) {
                    await new Promise<void>((resolve) => { self.wake = resolve })
                }
                const data = self.reqiestedData.pop()
                if (!data) { continue }
                self.reqiestedData.unshift()
                yield data
            }
        })()
    })
}

export default {
    Socket: jest.fn().mockImplementation(() => {
        return new Socket()
    })
}
