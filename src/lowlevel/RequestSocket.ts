import net from 'net'
import { on, once } from 'events'
import { PromiseQueue } from '../utils/PromiseQueue'

export interface RequestParam {
    cmd: number;
    p1: number;
    p2: number;
    extension?: ArrayBuffer;
    responseExtension: boolean;
}
const toBuffer = (req: RequestParam): Buffer => {
    const extensionSize = req.extension?.byteLength ?? 0
    const size = 4 * 4 + extensionSize
    const buffer = Buffer.alloc(size)
    buffer.writeUInt32LE(req.cmd, 0)
    buffer.writeUInt32LE(req.p1, 4)
    buffer.writeUInt32LE(req.p2, 8)
    buffer.writeUInt32LE(extensionSize, 12)
    if (req.extension) {
        buffer.set(new Uint8Array(req.extension), 16)
    }
    return buffer
}

export interface ResponseParam {
    cmd: number;
    p1: number;
    p2: number;
    res: number;
    extension?: Buffer;
}
const responseSize = 16
const fromBuffer = (data: Buffer): ResponseParam | undefined => {
    if (data.length < responseSize) {
        return undefined
    }
    const cmd = data.readUInt32LE(0)
    const p1 = data.readUInt32LE(4)
    const p2 = data.readUInt32LE(8)
    const res = data.readInt32LE(12)
    const extensionData = data.slice(16)
    const extension = extensionData.length > 0 ? extensionData : undefined
    return {
        cmd, p1, p2, res, extension
    }
}

async function execRequest (
    sock: net.Socket,
    request: RequestParam,
    timeout?: number
): Promise<ResponseParam> {
    sock.write(toBuffer(request))
    if (timeout != null) {
        setTimeout(
            () => sock.emit('error', new Error(`timeout of ${timeout} exceeded`)),
            timeout
        )
    }

    let data: Buffer = Buffer.alloc(0)
    for await (const [chunk] of on(sock, 'data')) {
        data = Buffer.concat([data, chunk as Buffer])
        const response = fromBuffer(data)
        if (response) {
            if (
                request.cmd !== response.cmd ||
                request.p1 !== response.p1 ||
                request.p2 !== response.p2
            ) {
                throw new Error('Invalid Response')
            }
            // Check extension received
            if (
                !request.responseExtension ||
                 response.res === (response.extension?.length ?? 0)
            ) {
                return response
            }
        }
    }
    throw new Error('Invalid Response')
}

export function requestFactory (
    sock: net.Socket,
    request: RequestParam,
    timeout?: number
): () => Promise<ResponseParam> {
    return () => execRequest(sock, request, timeout)
}

export interface RequestSocket {
    request(request: RequestParam, timeout?: number): Promise<ResponseParam>;
    close(): Promise<void>;
    connected: boolean;
}
class SocketImpl implements RequestSocket {
    sock: net.Socket;

    requestQueue = new PromiseQueue();
    connected = false;

    constructor () {
        this.sock = new net.Socket()
    }

    async connect (port: number, host: string): Promise<void> {
        const { sock } = this
        sock.connect(port, host)
        sock.on('close', (hadErr) => {
            this.connected = false
            if (hadErr && !sock.connecting && !sock.destroyed) {
                sock.connect(port, host)
            }
        })
        await once(sock, 'connect')
        this.connected = true
        sock.setNoDelay()
    }

    async request (
        request: RequestParam,
        timeout?: number
    ): Promise<ResponseParam> {
        const { sock } = this

        const promise = requestFactory(sock, request, timeout)

        return this.requestQueue.add(promise)
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async close () {
        this.sock.destroy()
    }
}

export const createRequestSocket = async (
    port: number,
    host: string
): Promise<RequestSocket> => {
    const sock = new SocketImpl()
    await sock.connect(port, host)
    return sock
}
