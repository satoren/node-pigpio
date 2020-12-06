/* eslint-disable @typescript-eslint/no-var-requires */
import { CanvasKit, EmulatedCanvas2DContext } from 'canvaskit-wasm'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const CanvasKitInit = require('canvaskit-wasm/bin/canvaskit.js')

export type CanvasRenderingContext2D = EmulatedCanvas2DContext

export const init = async (): Promise<CanvasKit> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  (await CanvasKitInit()) as CanvasKit
