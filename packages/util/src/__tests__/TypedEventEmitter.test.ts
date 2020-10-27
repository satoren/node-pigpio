
import { MonoTypedEventEmitter } from '../TypedEventEmitter'

beforeEach(() => {
    jest.clearAllMocks()
})
test('on emit', async () => {
    const emitter = new MonoTypedEventEmitter<number>()
    const on = jest.fn()
    emitter.on(on)

    await emitter.emit(3)
    expect(on).toBeCalledWith(3)
})

test('once emit', async () => {
    const emitter = new MonoTypedEventEmitter<number>()
    const once = jest.fn()
    emitter.once(once)

    await emitter.emit(3)
    await emitter.emit(5)
    expect(once).toBeCalledWith(3)
    expect(once).toBeCalledTimes(1)
})

test('on off', async () => {
    const emitter = new MonoTypedEventEmitter<number>()
    const on = jest.fn()
    emitter.on(on)
    emitter.off(on)

    await emitter.emit(3)
    expect(on).not.toBeCalled()
})
