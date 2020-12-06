export type ImageDataFormatType = 'RGBA32' | 'RGB16_565' | 'A8' | 'A1'
export interface ImageData {
  /**
   * Returns the one-dimensional array containing the data in RGBA order, as integers in the range 0 to 255.
   */
  readonly data: Uint8ClampedArray
  /**
   * Returns the actual dimensions of the data in the ImageData object, in pixels.
   */
  readonly height: number
  /**
   * Returns the actual dimensions of the data in the ImageData object, in pixels.
   */
  readonly width: number

  /** data format if undefined format is RGBA32 */
  format?: ImageDataFormatType
}
export const isImageData = (d: unknown): d is ImageData => {
  const i = d as ImageData
  return typeof i.height === 'number' && typeof i.width === 'number'
}
