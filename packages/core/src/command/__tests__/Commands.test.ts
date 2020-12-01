import { createRequestParam } from '../Commands'

test('MODES request', () => {
  const a = createRequestParam({ command: 'MODES', gpio: 1, mode: 3 })
  expect(a).toEqual({
    cmd: 0,
    p1: 1,
    p2: 3,
    responseExtension: false,
  })
})
