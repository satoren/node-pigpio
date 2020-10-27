
import { MonoTypedEventEmitter } from './TypedEventEmitter'

beforeEach(() => {
    jest.clearAllMocks()
})
test('on emit', () => {
    const emitter = new MonoTypedEventEmitter<number>()
    const on = jest.fn()
    emitter.on(on)

    emitter.emit(3)
    expect(on).toBeCalledWith(3)
})

test('once emit', () => {
    const emitter = new MonoTypedEventEmitter<number>()
    const once = jest.fn()
    emitter.once(once)

    emitter.emit(3)
    emitter.emit(5)
    expect(once).toBeCalledWith(3)
    expect(once).toBeCalledTimes(1)
})

test('on off', () => {
    const emitter = new MonoTypedEventEmitter<number>()
    const on = jest.fn()
    emitter.on(on)
    emitter.off(on)

    emitter.emit(3)
    expect(on).not.toBeCalled()
})
