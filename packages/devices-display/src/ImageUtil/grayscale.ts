import { ImageData } from '../type'

const copy = (image: ImageData): ImageData => {
  return { ...image, data: new Uint8ClampedArray(image.data) }
}

const flat = <T>(a: T[][]): T[] => {
  return ([] as T[]).concat(...a)
}

export const grayscale = (image: ImageData): ImageData => {
  if (image.format === 'A8') {
    return copy(image)
  }
  if (image.format === 'A1') {
    throw Error('Unsupported format')
  }
  // TODO: Unsupported now.
  if (image.format === 'RGB16_565') {
    throw Error('Unsupported format')
  }

  const data = new Uint8ClampedArray(image.width * image.height)
  for (let i = 0; i < data.length; i++) {
    data[i] =
      0.2126 * image.data[i << 2] +
      0.7152 * image.data[(i << 2) + 1] +
      0.0722 * image.data[(i << 2) + 2]
  }
  return { data, width: image.width, height: image.height, format: 'A8' }
}

const GRAYS = 256
const THRESHOLD = Array.from({ length: 256 }, (_, i) =>
  i < GRAYS >> 1 ? 0 : GRAYS - 1
)
export const dithering = (image: ImageData): ImageData => {
  const gray = grayscale(image)
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const i = y * image.width + x
      const grayOld = gray.data[i]
      const grayNew = THRESHOLD[grayOld]
      const grayErr = (grayOld - grayNew) >> 3
      gray.data[i] = grayNew
      const NEAR = [
        [x + 1, y],
        [x + 2, y],
        [x - 1, y + 1],
        [x, y + 1],
        [x + 1, y + 1],
        [x, y + 2],
      ]
      let nearX = 0
      let nearY = 0
      for (let n = 0; n < NEAR.length; n++) {
        nearX = NEAR[n][0]
        nearY = NEAR[n][1]
        if (nearX >= 0) {
          if (nearX <= image.width) {
            if (nearY >= 0) {
              if (nearY <= image.height) {
                gray.data[nearY * image.width + nearX] += grayErr
              }
            }
          }
        }
      }
    }
  }

  return toA1(gray)
}

export const thresholding = (
  image: ImageData,
  threshold: number
): ImageData => {
  const gray = grayscale(image)

  for (let i = 0; i < gray.data.length; i++) {
    gray.data[i] = gray.data[i] >= threshold ? 255 : 0
  }
  return toA1(gray)
}
const toA1 = (image: ImageData): ImageData => {
  if (image.format === 'A1') {
    return image
  }
  if (image.format !== 'A8') {
    throw Error('Unsupported format')
  }

  const a1data = image.data
    .map((v) => (v > 0 ? 1 : 0))
    .reduce(
      (p, v): number[][] => {
        if (p[p.length - 1].length < 8) {
          p[p.length - 1].push(v)
        } else {
          p.push([v])
        }
        return p
      },
      [[]] as number[][]
    )
    .map((v) => v.reverse().reduce((p, v) => (p << 1) | v, 0))

  return {
    data: new Uint8ClampedArray(a1data),
    width: image.width,
    height: image.height,
    format: 'A1',
  }
}

export const toRGBA32 = (
  image: ImageData & { format: 'A1' | 'A8' }
): ImageData => {
  switch (image.format) {
    case 'A1': {
      const rgbadata = flat(
        Array.from(image.data).map((e) =>
          flat(
            Array.from({ length: 8 }, (_, k) => k).map((k) =>
              (e >> k) & 0x1 ? [255, 255, 255, 255] : [0, 0, 0, 255]
            )
          )
        )
      )
      return {
        data: new Uint8ClampedArray(rgbadata),
        width: image.width,
        height: image.height,
      }
    }
    case 'A8': {
      const rgbadata = flat(Array.from(image.data).map((e) => [e, e, e, 255]))
      return {
        data: new Uint8ClampedArray(rgbadata),
        width: image.width,
        height: image.height,
      }
    }
    default:
      throw Error('Unsupported format')
  }
}
