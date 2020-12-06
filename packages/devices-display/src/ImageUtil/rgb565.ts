import { ImageData } from '../type'

const copy = (image: ImageData): ImageData => {
  return { ...image, data: new Uint8ClampedArray(image.data) }
}
export const toRGB565 = (image: ImageData): ImageData => {
  if (image.format === 'RGB16_565') {
    return copy(image)
  }
  if (image.format && image.format !== 'RGBA32') {
    throw Error('Unsupported format')
  }
  const data = image.data
    .reduce(
      (p, v): number[][] => {
        if (p[p.length - 1].length < 4) {
          p[p.length - 1].push(v)
        } else {
          p.push([v])
        }
        return p
      },
      [[]] as number[][]
    )
    .flatMap((p) => {
      const r = p[0] >> 3
      const g = p[1] >> 2
      const b = p[2] >> 3
      return [((g & 0b111) << 5) | b, (r << 3) | (g >> 3)]
      //      return [(r << 3) | (g >> 3), ((g & 0b111) << 5) | b]
    })

  return {
    data: new Uint8ClampedArray(data),
    width: image.width,
    height: image.height,
    format: 'RGB16_565',
  }
}
