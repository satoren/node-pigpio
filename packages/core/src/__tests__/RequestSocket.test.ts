import { createRequestSocket, RequestSocket } from '../RequestSocket'
import { Socket } from '../__mocks__/net'

const mockSocket = new Socket()
jest.mock('net', () => ({ Socket: jest.fn().mockImplementation(() => mockSocket) }))

let target: RequestSocket
beforeEach(async () => {
    target = await createRequestSocket(0, '')
    jest.clearAllMocks()
})

test('event', async () => {
    await target.request({ cmd: 2, p1: 3, p2: 4, extension: Buffer.of(5, 6), responseExtension: false })
    expect(mockSocket.write).toBeCalledWith(Buffer.from([
        2,
        0,
        0,
        0,
        3,
        0,
        0,
        0,
        4,
        0,
        0,
        0,
        2,
        0,
        0,
        0,
        5,
        6]))
})

test('close', async () => {
    await target.close()
    expect(mockSocket.destroy).toBeCalled()
})
