
import { usingAsync } from '../usingAsync'

beforeEach(() => {
    jest.clearAllMocks()
})
test('using', async () => {
    const close = jest.fn()
    const handler = jest.fn()
    await usingAsync({ close }, handler)
    expect(handler).toBeCalledTimes(1)
    expect(close).toBeCalledTimes(1)
})
