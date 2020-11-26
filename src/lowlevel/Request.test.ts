import { createRequestParam } from './command/Commands'
import { requestFactory } from './Request'
import net from 'net'
import { Socket } from '../__mocks__/net'

const mockSocket = new Socket()
jest.mock('net', () => ({ Socket: jest.fn().mockImplementation(() => mockSocket) }))
beforeEach(() => {
    jest.clearAllMocks()
})

beforeEach(() => {
    jest.clearAllMocks()
})

test('requestFactory', async () => {
    const req = requestFactory(new net.Socket(), createRequestParam({ command: 'NOIB' }))

    mockSocket.write.mockImplementationOnce((data) => {
        setImmediate(() => {
            mockSocket.emit('data', data)
        })
    })

    const res = await req()

    expect(mockSocket.write).toBeCalled()
    expect(res).toStrictEqual({
        cmd: 99,
        extension: undefined,
        p1: 0,
        p2: 0,
        res: 0
    })
})

test('separated response', async () => {
    const req = requestFactory(new net.Socket(), createRequestParam({ command: 'NOIB' }))

    mockSocket.write.mockImplementationOnce((data) => {
        setImmediate(() => {
            mockSocket.emit('data', data.slice(0, 4))
            setImmediate(() => {
                mockSocket.emit('data', data.slice(4))
            })
        })
    })
    const res = await req()
    expect(mockSocket.write).toBeCalled()
    expect(res).toStrictEqual({
        cmd: 99,
        extension: undefined,
        p1: 0,
        p2: 0,
        res: 0
    })
})
test('extended response', async () => {
    const req = requestFactory(new net.Socket(), createRequestParam({ command: 'I2CRD', handle: 3, count: 3 }))

    mockSocket.write.mockImplementationOnce((data) => {
        setImmediate(() => {
            mockSocket.emit('data', Buffer.concat([data.slice(0, 12), Buffer.of(4, 0, 0, 0), Buffer.of(43, 54, 65, 43)]))
        })
    })
    const res = await req()
    expect(mockSocket.write).toBeCalled()
    expect(res).toStrictEqual({
        cmd: 56,
        extension: Buffer.of(43, 54, 65, 43),
        p1: 3,
        p2: 3,
        res: 4
    })
})

test('invalid response', async () => {
    const req = requestFactory(new net.Socket(), createRequestParam({ command: 'NOIB' }))

    mockSocket.write.mockImplementationOnce(() => {
        setImmediate(() => {
            mockSocket.emit('data', Buffer.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6))
        })
    })
    const res = req()
    await expect(res).rejects.toThrowError()
})

test('timeout response', async () => {
    const req = requestFactory(new net.Socket(), createRequestParam({ command: 'I2CRD', handle: 3, count: 3 }), 0)

    mockSocket.write.mockImplementationOnce((data) => {
        setTimeout(() => {
            mockSocket.emit('data', Buffer.concat([data.slice(0, 12), Buffer.of(4, 0, 0, 0), Buffer.of(43, 54, 65, 43)]))
        }, 100)
    })
    const res = req()
    await expect(res).rejects.toThrowError()
})

test('socket error response', async () => {
    const req = requestFactory(new net.Socket(), createRequestParam({ command: 'NOIB' }))
    mockSocket.write.mockImplementationOnce(() => {
        setTimeout(() => {
            mockSocket.emit('error', Error('error'))
        }, 0)
    })
    const res = req()
    await expect(res).rejects.toThrowError()
})

test('socket closed ', async () => {
    const req = requestFactory(new net.Socket(), createRequestParam({ command: 'NOIB' }))
    mockSocket.write.mockImplementationOnce(() => {
        setTimeout(() => {
            mockSocket.emit('close', Error('error'))
        }, 0)
    })
    const res = req()
    await expect(res).rejects.toThrowError()
})
