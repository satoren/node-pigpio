import { grayscale, dithering, toRGBA32 } from '../grayscale'

describe('grayscale', () => {
  test('minimal white', async () => {
    const d = grayscale({
      width: 4,
      height: 2,
      data: new Uint8ClampedArray(
        Array.from({ length: 2 * 4 * 4 }, () => 0xff)
      ),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      format: 'A8',
      data: new Uint8ClampedArray(Array.from({ length: 2 * 4 }, () => 0xff)),
    })
  })
})

describe('dithering', () => {
  test('minimal white', async () => {
    const d = dithering({
      width: 4,
      height: 2,
      format: 'A8',
      data: new Uint8ClampedArray(Array.from({ length: 2 * 4 }, () => 0xff)),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      format: 'A1',
      data: new Uint8ClampedArray([0xff]),
    })
  })
  test('black, white', async () => {
    const d = dithering({
      width: 4,
      height: 2,
      format: 'A8',
      data: new Uint8ClampedArray(
        Array.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff])
      ),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      format: 'A1',
      data: new Uint8ClampedArray([0xf0]),
    })
  })
  test('white, black', async () => {
    const d = dithering({
      width: 4,
      height: 2,
      format: 'A8',
      data: new Uint8ClampedArray(
        Array.from([0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00])
      ),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      format: 'A1',
      data: new Uint8ClampedArray([0x0f]),
    })
  })
})
describe('A8toRGBA32', () => {
  test('minimal white', async () => {
    const d = toRGBA32({
      width: 4,
      height: 2,
      format: 'A8',
      data: new Uint8ClampedArray(Array.from({ length: 2 * 4 }, () => 0xff)),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      data: new Uint8ClampedArray(
        Array.from({ length: 2 * 4 * 4 }, () => 0xff)
      ),
    })
  })
  test('minimal black', async () => {
    const d = toRGBA32({
      width: 4,
      height: 2,
      format: 'A8',
      data: new Uint8ClampedArray(Array.from({ length: 2 * 4 }, () => 0x00)),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      data: new Uint8ClampedArray(
        Array.from({ length: 2 * 4 }).flatMap(() => [0, 0, 0, 0xff])
      ),
    })
  })
})

describe('A1toRGBA32', () => {
  test('minimal white', async () => {
    const d = toRGBA32({
      width: 4,
      height: 2,
      format: 'A1',
      data: new Uint8ClampedArray(Array.from({ length: 1 }, () => 0xff)),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      data: new Uint8ClampedArray(
        Array.from({ length: 2 * 4 * 4 }, () => 0xff)
      ),
    })
  })
  test('minimal black', async () => {
    const d = toRGBA32({
      width: 4,
      height: 2,
      format: 'A1',
      data: new Uint8ClampedArray(Array.from({ length: 1 }, () => 0x00)),
    })
    expect(d).toStrictEqual({
      width: 4,
      height: 2,
      data: new Uint8ClampedArray(
        Array.from({ length: 2 * 4 }).flatMap(() => [0, 0, 0, 0xff])
      ),
    })
  })
})
