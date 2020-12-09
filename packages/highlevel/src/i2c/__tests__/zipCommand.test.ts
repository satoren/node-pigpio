import { buildZipCommand, I2cZipCommand } from '../zipCommand'

test('build read command', () => {
  const command = buildZipCommand({ type: 'Read', size: 128 }, false)
  expect([...command]).toMatchObject([6, 128])
})
test('build write command', () => {
  const command = buildZipCommand(
    { type: 'Write', data: new Uint8Array(64) },
    false
  )
  expect([...command]).toMatchObject([7, 64, ...new Uint8Array(64)])
})

test('build read command larger then 255', () => {
  const command = buildZipCommand({ type: 'Read', size: 500 }, false)
  expect([...command]).toMatchObject([1, 6, 244, 1])
})

test('build write command larger then 255', () => {
  const command = buildZipCommand(
    { type: 'Write', data: new Uint8Array(500) },
    false
  )
  expect([...command]).toMatchObject([1, 7, 244, 1, ...new Uint8Array(500)])
})

test('build 65535 bytes read command ', () => {
  const command = buildZipCommand({ type: 'Read', size: 65535 }, false)
  expect([...command]).toMatchObject([1, 6, 255, 255])
})

test('build read command larger then 65535', () => {
  expect(() => {
    buildZipCommand({ type: 'Read', size: 65536 }, false)
  }).toThrow()
})

test('invalid command', () => {
  expect(() => {
    buildZipCommand(({ type: 'a' } as unknown) as I2cZipCommand, false)
  }).toThrow()
})
