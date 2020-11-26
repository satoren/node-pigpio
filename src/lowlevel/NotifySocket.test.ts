
import { createNotifySocket, NotifySocket, EventCallback, EdgeCallback } from './NotifySocket'
import { RequestSocket } from './RequestSocket'
import RequestCommand from '../lowlevel/command/RequestCommands'

import { Socket } from '../__mocks__/net'

const mockSocket = new Socket()
jest.mock('net', () => ({ Socket: jest.fn().mockImplementation(() => mockSocket) }))

const sleep = (msec: number) => {
    return new Promise((resolve) => setTimeout(resolve, msec))
}

const mockRequest = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    request: jest.fn((arg) => (new Promise((resolve) => resolve({ ...arg, res: 0 })))),
    close: jest.fn(),
    get connected (): boolean {
        return true
    }
}
jest.mock('../lowlevel/RequestSocket', () => ({
    createRequestSocket: () => mockRequest
}))

let target: NotifySocket
beforeEach(async () => {
    target = await createNotifySocket(0, '', mockRequest as RequestSocket)
    jest.clearAllMocks()
})

test('add/remove single event', () => {
    const e: EventCallback = { event: 5, bit: 1 << 5, func: jest.fn() }
    target.appendEvent(e)
    expect(mockRequest.request).toBeCalledWith({
        cmd: 115,
        p1: 0,
        p2: (1 << 5),
        responseExtension: false
    })
    mockRequest.request.mockClear()
    target.removeEvent(e)
    expect(mockRequest.request).toBeCalledWith({
        cmd: 115,
        p1: 0,
        p2: 0,
        responseExtension: false
    })
})

test('add/remove multiple event', () => {
    const e1: EventCallback = { event: 5, bit: 1 << 5, func: jest.fn() }
    const e2: EventCallback = { event: 2, bit: 1 << 2, func: jest.fn() }
    target.appendEvent(e1)
    mockRequest.request.mockClear()
    target.appendEvent(e2)
    expect(mockRequest.request).toBeCalledWith({
        cmd: 115,
        p1: 0,
        p2: (1 << 5) | (1 << 2),
        responseExtension: false
    })
    mockRequest.request.mockClear()
    target.removeEvent(e1)
    expect(mockRequest.request).toBeCalledWith({
        cmd: 115,
        p1: 0,
        p2: (1 << 2),
        responseExtension: false
    })
})

test('add/remove single callback', () => {
    const e: EdgeCallback = { gpio: 5, edge: 2, bit: 1 << 5, func: jest.fn() }
    target.append(e)
    expect(mockRequest.request).toBeCalledWith({
        cmd: 19,
        p1: 0,
        p2: (1 << 5),
        responseExtension: false
    })
    mockRequest.request.mockClear()
    target.remove(e)
    expect(mockRequest.request).toBeCalledWith({
        cmd: 19,
        p1: 0,
        p2: 0,
        responseExtension: false
    })
})

test('add/remove multiple callback', () => {
    const e1: EdgeCallback = { gpio: 5, edge: 2, bit: 1 << 5, func: jest.fn() }
    const e2: EdgeCallback = { gpio: 2, edge: 1, bit: 1 << 2, func: jest.fn() }
    target.append(e1)
    mockRequest.request.mockClear()
    target.append(e2)
    expect(mockRequest.request).toBeCalledWith({
        cmd: 19,
        p1: 0,
        p2: (1 << 5) | (1 << 2),
        responseExtension: false
    })
    mockRequest.request.mockClear()
    target.remove(e1)
    expect(mockRequest.request).toBeCalledWith({
        cmd: 19,
        p1: 0,
        p2: (1 << 2),
        responseExtension: false
    })
})

interface Notify {
    seqno: number;
    flags: number;
    tick: number;
    level: number;
}
function notifyToBuffer ({ seqno, flags, tick, level }: Notify): Buffer {
    const buffer = Buffer.alloc(12)
    buffer.writeInt16LE(seqno, 0)
    buffer.writeInt16LE(flags, 2)
    buffer.writeInt32LE(tick, 4)
    buffer.writeInt32LE(level, 8)
    return buffer
}

test('notify edge', async () => {
    const e1: EdgeCallback = { gpio: 5, edge: 2, bit: 1 << 5, func: jest.fn() }
    const fallingEdge2: EdgeCallback = { gpio: 2, edge: 1, bit: 1 << 2, func: jest.fn() }
    const risingEdge2: EdgeCallback = { gpio: 2, edge: 0, bit: 1 << 2, func: jest.fn() }
    target.append(e1)
    target.append(risingEdge2)
    target.append(fallingEdge2)

    mockSocket.emit('data', notifyToBuffer({ seqno: 0, flags: 0, tick: 32, level: 1 << 5 }))

    await sleep(0.1)
    expect(e1.func).lastCalledWith(5, 1, 32)
    mockSocket.emit('data', notifyToBuffer({ seqno: 0, flags: 0, tick: 32, level: 0 }))
    expect(e1.func).lastCalledWith(5, 0, 32)
    expect(risingEdge2.func).not.toBeCalled()
    expect(fallingEdge2.func).not.toBeCalled()

    mockSocket.emit('data', notifyToBuffer({ seqno: 0, flags: 0, tick: 33, level: 1 << 2 }))
    expect(risingEdge2.func).lastCalledWith(2, 1, 33)
    expect(fallingEdge2.func).not.toBeCalled()
    mockSocket.emit('data', notifyToBuffer({ seqno: 0, flags: 0, tick: 33, level: 0 }))
    expect(risingEdge2.func).lastCalledWith(2, 1, 33)
    expect(fallingEdge2.func).lastCalledWith(2, 0, 33)
})

test('notify wdog', () => {
    const WDOGFlag = (1 << 5)
    const e1: EdgeCallback = { gpio: 5, edge: 2, bit: 1 << 5, func: jest.fn() }
    const fallingEdge2: EdgeCallback = { gpio: 2, edge: 1, bit: 1 << 2, func: jest.fn() }
    const risingEdge2: EdgeCallback = { gpio: 2, edge: 0, bit: 1 << 2, func: jest.fn() }
    target.append(e1)
    target.append(risingEdge2)
    target.append(fallingEdge2)

    mockSocket.emit('data', notifyToBuffer({ seqno: 0, flags: WDOGFlag | 5, tick: 32, level: 0 }))
    expect(e1.func).lastCalledWith(5, 'TIMEOUT', 32)
    expect(risingEdge2.func).not.toBeCalled()
    expect(fallingEdge2.func).not.toBeCalled()

    mockSocket.emit('data', notifyToBuffer({ seqno: 0, flags: WDOGFlag | 2, tick: 33, level: 0 }))
    expect(e1.func).lastCalledWith(5, 'TIMEOUT', 32)
    expect(risingEdge2.func).lastCalledWith(2, 'TIMEOUT', 33)
    expect(fallingEdge2.func).lastCalledWith(2, 'TIMEOUT', 33)
})

test('notify event', () => {
    const EventFlag = (1 << 7)
    const e1: EventCallback = { event: 5, bit: 1 << 5, func: jest.fn() }
    const e2: EventCallback = { event: 2, bit: 1 << 2, func: jest.fn() }
    target.appendEvent(e1)
    target.appendEvent(e2)

    mockSocket.emit('data', notifyToBuffer({ seqno: 0, flags: EventFlag | 5, tick: 32, level: 333 }))
    expect(e1.func).lastCalledWith(5, 32)
    expect(e2.func).not.toBeCalled()
    mockSocket.emit('data', notifyToBuffer({ seqno: 0, flags: EventFlag | 2, tick: 555, level: 44543 }))
    expect(e1.func).lastCalledWith(5, 32)
    expect(e2.func).lastCalledWith(2, 555)
})
test('close event', async () => {
    const e1: EventCallback = { event: 5, bit: 1 << 5, func: jest.fn() }
    const e2: EventCallback = { event: 2, bit: 1 << 2, func: jest.fn() }
    target.appendEvent(e1)
    target.appendEvent(e2)

    mockSocket.write.mockClear()
    await target.close()
    expect(mockSocket.write).toBeCalledWith(Buffer.from([
        RequestCommand.NC.cmdNo,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0]))
})
