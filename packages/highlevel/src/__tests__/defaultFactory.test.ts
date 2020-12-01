import defaultFactory from '../defaultFactory'

test('get', async () => {
  const pi = await defaultFactory.get()
  const spy = jest.spyOn(pi, 'close')
  await pi.close()
  expect(spy).toHaveBeenCalled()
})
test('shutdown', async () => {
  const pi = await defaultFactory.get()
  const spy = jest.spyOn(pi, 'close')
  defaultFactory.shutdown()
  expect(spy).toHaveBeenCalled()
})
test('autoclose', async () => {
  const pi = await defaultFactory.get()
  const spy = jest.spyOn(pi, 'close')
  await pi.gpio(4).close()
  expect(spy).toHaveBeenCalled()
})
