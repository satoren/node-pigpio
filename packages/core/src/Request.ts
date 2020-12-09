import net from 'net'

export interface RequestParam {
  cmd: number
  p1: number
  p2: number
  extension?: Uint8Array
  responseExtension: boolean
}

export interface ResponseParam {
  cmd: number
  p1: number
  p2: number
  res: number
  extension?: Uint8Array
}
const responseSize = 16
const fromBuffer = (data: Uint8Array): ResponseParam | undefined => {
  if (data.length < responseSize) {
    return undefined
  }
  const dataview = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const cmd = dataview.getUint32(0, true)
  const p1 = dataview.getUint32(4, true)
  const p2 = dataview.getUint32(8, true)
  const res = dataview.getInt32(12, true)
  const extensionData = data.slice(16)
  const extension = extensionData.length > 0 ? extensionData : undefined
  return {
    cmd,
    p1,
    p2,
    res,
    extension,
  }
}

const toBuffer = (req: RequestParam): Uint8Array => {
  const extensionSize = req.extension?.byteLength ?? 0
  const size = 4 * 4 + extensionSize
  const buffer = new Uint8Array(size)
  const dataview = new DataView(buffer.buffer)
  dataview.setUint32(0, req.cmd, true)
  dataview.setUint32(4, req.p1, true)
  dataview.setUint32(8, req.p2, true)
  dataview.setUint32(12, extensionSize, true)
  if (req.extension) {
    buffer.set(new Uint8Array(req.extension), 16)
  }
  return buffer
}
async function execRequest(
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
  let eventOff: () => void
  return new Promise<ResponseParam>((resolve, reject) => {
    const dataListener = (chunk: Buffer) => {
      data = Buffer.concat([data, chunk])
      const response = fromBuffer(data)
      if (response) {
        if (
          request.cmd !== response.cmd ||
          request.p1 !== response.p1 ||
          request.p2 !== response.p2
        ) {
          reject(new Error('Invalid Response'))
        }
        // Check extension received
        if (
          !request.responseExtension ||
          response.res === (response.extension?.length ?? 0)
        ) {
          resolve(response)
        }
      }
    }
    const errorListener = (error: Error) => {
      reject(error)
    }
    eventOff = () => {
      sock.off('data', dataListener)
      sock.off('error', errorListener)
    }

    sock.on('data', dataListener)
    sock.on('error', errorListener)
  }).finally(() => {
    eventOff()
  })
  throw new Error('Invalid Response2')
}

export function requestFactory(
  sock: net.Socket,
  request: RequestParam,
  timeout?: number
): () => Promise<ResponseParam> {
  return () => execRequest(sock, request, timeout)
}
