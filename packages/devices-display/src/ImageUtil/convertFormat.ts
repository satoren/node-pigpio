import { grayscale, thresholding } from './grayscale'
import { toRGB565 } from './rgb565'
import { ImageData, ImageDataFormatType } from '../type'

export const convert = (
  image: ImageData,
  format: ImageDataFormatType
): ImageData => {
  switch (format) {
    case 'RGB16_565':
      return toRGB565(image)
    case 'A8':
      return grayscale(image)
    case 'A1':
      return thresholding(image, 128)
    default:
      throw Error('Unsupported format')
  }
}
