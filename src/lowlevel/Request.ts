import net from 'net'

export interface RequestParam {
    cmd: number;
    p1: number;
    p2: number;
    extension?: ArrayBuffer;
    responseExtension: boolean;
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
    for await (const chunk of sock) {
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
