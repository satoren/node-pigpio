import { MonoTypedEventEmitter } from '../index'

beforeEach(() => {
  jest.clearAllMocks()
})

test('can import', async () => {
  const emitter = new MonoTypedEventEmitter<number>()
  const on = jest.fn()
  emitter.on(on)

  await emitter.emit(3)
  expect(on).toBeCalledWith(3)
})
