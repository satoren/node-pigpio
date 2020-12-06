import { toRGB565 } from '../rgb565'

describe('toRGB565', () => {
  test('minimal white', async () => {
    const d = toRGB565({
      width: 4,
      height: 2,
      data: new Uint8ClampedArray(
        Array.from({ length: 2 * 4 * 4 }, () => 0xff)
      ),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      format: 'RGB16_565',
      data: new Uint8ClampedArray(
        Array.from({ length: 2 * 4 * 2 }, () => 0xff)
      ),
    })
  })
  test('minimal black', async () => {
    const d = toRGB565({
      width: 4,
      height: 2,
      data: new Uint8ClampedArray(Array.from({ length: 2 * 4 * 4 }, () => 0x0)),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      format: 'RGB16_565',
      data: new Uint8ClampedArray(Array.from({ length: 2 * 4 * 2 }, () => 0x0)),
    })
  })
})
