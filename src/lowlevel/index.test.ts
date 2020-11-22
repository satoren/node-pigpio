import * as pigpio from './'

const mockRequestSocket = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    request: jest.fn((arg) => ({ ...arg, res: 0 })),
    close: jest.fn()
}
const mockNotifySocket = {
    appendEvent: jest.fn(),
    removeEvent: jest.fn(),
    append: jest.fn(),
    remove: jest.fn(),
    close: jest.fn()
}
jest.mock('../lowlevel/RequestSocket', () => ({
    createRequestSocket: () => mockRequestSocket
}))
jest.mock('../lowlevel/NotifySocket', () => ({
    createNotifySocket: () => mockNotifySocket
}))

let pi: pigpio.pigpio
beforeEach(async () => {
    pi = await pigpio.pi()
    jest.clearAllMocks()
})
test('tickDiff', () => {
    expect(pigpio.tickDiff(4294967272, 12)).toBe(36)
})
