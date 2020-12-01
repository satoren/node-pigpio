import net from 'net'
import { once } from 'events'
import { PromiseQueue } from './utils/PromiseQueue'
import { RequestParam, ResponseParam, requestFactory } from './Request'

export interface RequestSocket {
  request(request: RequestParam, timeout?: number): Promise<ResponseParam>
  close(): Promise<void>
  connected: boolean
}
class SocketImpl implements RequestSocket {
  sock: net.Socket

  requestQueue = new PromiseQueue()
  connected = false
  closeHandler = () => {
    this.connected = false
  }

  constructor() {
    this.sock = new net.Socket()
  }

  async connect(port: number, host: string): Promise<void> {
    const { sock } = this
    sock.connect(port, host)
    sock.once('close', this.closeHandler)
    await once(sock, 'connect')
    this.connected = true
    sock.setNoDelay()
  }

  async request(
    request: RequestParam,
    timeout?: number
  ): Promise<ResponseParam> {
    const { sock } = this

    const promise = requestFactory(sock, request, timeout)

    return this.requestQueue.add(promise)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async close() {
    this.sock.off('close', this.closeHandler)
    this.connected = false
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
