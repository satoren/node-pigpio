/* eslint-disable no-bitwise */
import net from 'net'
import { EventEmitter, once } from 'events'
import { createRequestParam } from './command/Commands'
import { RequestSocket } from './RequestSocket'
import { requestFactory } from './Request'

interface Notify {
    ///  starts at 0 each time the handle is opened and then increments by one for each report.
    seqno: number;
    /* three flags are defined, PI_NTFY_FLAGS_WDOG,
  PI_NTFY_FLAGS_ALIVE, and PI_NTFY_FLAGS_EVENT.
  If bit 5 is set (PI_NTFY_FLAGS_WDOG) then bits 0-4 of the flags
  indicate a GPIO which has had a watchdog timeout.
  If bit 6 is set (PI_NTFY_FLAGS_ALIVE) this indicates a keep alive
  signal on the pipe/socket and is sent once a minute in the absence
  of other notification activity.
  If bit 7 is set (PI_NTFY_FLAGS_EVENT) then bits 0-4 of the flags
  indicate an event which has been triggered.
  */
    flags: number;
    /// the number of microseconds since system boot.  It wraps around after 1h12m.
    tick: number;
    /// indicates the level of each GPIO.  If bit 1<<x is set then GPIO x is high.
    level: number;
}
enum NotifyFlag {
    EVENT = 1 << 7,
    ALIVE = 1 << 6,
    WDOG = 1 << 5,
}
const fromBuffer = (data: Buffer): Notify => {
    const seqno = data.readUInt16LE(0)
    const flags = data.readUInt16LE(2)
    const tick = data.readUInt32LE(4)
    const level = data.readUInt32LE(8)
    return {
        seqno, flags, tick, level
    }
}
const notifySize = 12

export interface EventCallback{
    event: number,
    bit: number,
    func:(event: number, tick: number) => void
}
export interface EdgeCallback{
    gpio : number,
    edge: number,
    bit: number,
    func: (gpio: number, level: 0 | 1 | 'TIMEOUT', tick: number) => void
}

export interface NotifySocket {
    close(): Promise<void>;

    appendEvent(e: EventCallback): void;
    removeEvent(e: EventCallback): void;
    append(e: EdgeCallback): void;
    remove(e: EdgeCallback): void;
}

class SocketImpl extends EventEmitter implements NotifySocket {
    sock: net.Socket;

    handle?: number;

    lastLevel = 0;

    callbacks = new Set<EdgeCallback>()
    monitor = 0
    events = new Set<EventCallback>()
    eventBits = 0

    constructor (
        private control: RequestSocket) {
        super()
        this.sock = new net.Socket()
    }

    async connect (port: number, host: string): Promise<void> {
        const { sock } = this

        sock.connect(port, host)
        await once(sock, 'connect')
        sock.setNoDelay()
    }

    dataHandler (): void {
        const { sock } = this

        let data: Buffer = Buffer.alloc(0)
        const handleData = (chunk: Buffer) => {
            data = Buffer.concat([data, chunk])
            while (data.length >= notifySize) {
                const notify = fromBuffer(data)
                data = data.slice(notifySize)
                if (notify.flags === 0) {
                    this.notifyEdgeChanged(notify)
                } else {
                    this.notifyEvent(notify)
                }
            }
        }
        sock.on('data', handleData)
    }

    notifyEdgeChanged (notify: Notify) {
        const changed = notify.level ^ this.lastLevel
        this.lastLevel = notify.level

        for (const cb of this.callbacks.values()) {
            if (cb.bit & changed) {
                const newLevel = (cb.bit & notify.level) ? 1 : 0
                if (newLevel ^ cb.edge) {
                    cb.func(cb.gpio, newLevel, notify.tick)
                }
            }
        }
    }

    notifyEvent (notify: Notify) {
        if (notify.flags & NotifyFlag.WDOG) {
            const gpio = notify.flags & 31

            for (const cb of this.callbacks.values()) {
                if (cb.gpio === gpio) {
                    cb.func(cb.gpio, 'TIMEOUT', notify.tick)
                }
            }
        } else if (notify.flags & NotifyFlag.EVENT) {
            const event = notify.flags & 31

            for (const cb of this.events.values()) {
                if (cb.event === event) {
                    cb.func(event, notify.tick)
                }
            }
        }
    }

    async start () {
        const { sock } = this

        this.lastLevel = (await requestFactory(sock, createRequestParam({ command: 'BR1' }))()).res
        this.handle = (
            await requestFactory(sock, createRequestParam({ command: 'NOIB' }))()
        ).res

        this.dataHandler()
    }

    appendEvent (e: EventCallback): void {
        const { handle } = this
        if (handle == null) { return }
        this.events.add(e)
        this.eventBits = this.eventBits | e.bit
        const bits = this.eventBits
        void this.control.request(createRequestParam({ command: 'EVM', bits, handle }))
    }

    removeEvent (e: EventCallback): void {
        const { handle } = this
        if (handle == null) { return }
        this.events.delete(e)
        this.eventBits = Array(...this.events.values()).reduce((prev, cur) => prev | cur.bit, 0)
        const bits = this.eventBits
        void this.control.request(createRequestParam({ command: 'EVM', bits, handle }))
    }

    append (e: EdgeCallback): void {
        const { handle } = this
        if (handle == null) { return }
        this.callbacks.add(e)
        this.monitor = this.monitor | e.bit
        const { monitor: bits } = this
        void this.control.request(createRequestParam({ command: 'NB', bits, handle }))
    }

    remove (e: EdgeCallback): void {
        const { handle } = this
        if (handle == null) { return }
        this.callbacks.delete(e)
        this.monitor = Array(...this.callbacks.values()).reduce((prev, cur) => prev | cur.bit, 0)

        const { monitor: bits } = this
        void this.control.request(createRequestParam({ command: 'NB', bits, handle }))
    }

    async close (): Promise<void> {
        const { sock, handle } = this
        if (handle != null) {
            await requestFactory(sock, createRequestParam({ command: 'NC', handle }))()
        }
        this.sock.destroy()
    }
}

export const createNotifySocket = async (
    port: number,
    host: string,
    control: RequestSocket
): Promise<NotifySocket> => {
    const sock = new SocketImpl(control)
    await sock.connect(port, host)
    await sock.start()

    return sock
}
