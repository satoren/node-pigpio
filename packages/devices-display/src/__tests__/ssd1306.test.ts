import { version } from 'prettier'
import { Ssd1306 } from '../ssd1306'

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (v, k) => k + start)

test('init', async () => {
  const close = jest.fn()
  const command = jest.fn()
  const data = jest.fn()
  const ssd1306 = new Ssd1306({ command, data, close })
  await ssd1306.init()
  expect(command).toHaveBeenCalled()
  await ssd1306.close()
})

const uint8ArrayConcat = (a: Uint8Array[]) => {
  const length = a.reduce((p, c) => p + c.length, 0)
  const buffer = new Uint8Array(length)
  let offset = 0
  a.forEach((v) => {
    buffer.set(v, offset)
    offset += v.length
  })
  return buffer
}

test('draw vertical 1 line', async () => {
  const close = jest.fn()
  const command = jest.fn()
  const data = jest.fn()
  const ssd1306 = new Ssd1306({ command, data, close }, 128, 64)
  const line = Uint8Array.of(0b000000001, ...range(0, 14).map(() => 0))
  const d = uint8ArrayConcat(range(0, 63).map(() => line))
  await ssd1306.draw(d)

  const verticalline = uint8ArrayConcat(
    range(0, 7).map(() =>
      Uint8Array.of(0b11111111, ...range(0, 126).map(() => 0))
    )
  )
  const expectData = uint8ArrayConcat([Uint8Array.of(0b01000000), verticalline])
  expect(data).toHaveBeenCalledWith(expectData)
  await ssd1306.close()
})
test('draw horizontal 1 line', async () => {
  const close = jest.fn()
  const command = jest.fn()
  const data = jest.fn()
  const ssd1306 = new Ssd1306({ command, data, close }, 128, 64)
  const dline = Uint8Array.of(...range(0, 15).map(() => 0b11111111))
  const d = uint8ArrayConcat([dline, new Uint8Array(1024 - 16)])
  expect(d.length).toBe((128 * 64) / 8)
  await ssd1306.draw(d)

  const line = Uint8Array.of(
    ...range(0, 127).map(() => 0b000000001),
    ...new Uint8Array(1024 - 128)
  )
  const expectData = uint8ArrayConcat([Uint8Array.of(0b01000000), line])
  expect(data).toHaveBeenCalledWith(expectData)
  await ssd1306.close()
})
