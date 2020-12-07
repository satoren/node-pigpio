import { Ssd1306, ImageUtil } from '@node-pigpio/devices-display'
import { init as CanvasKitInit } from './canvaskit-node-support'
import { drawClock } from './draw-clock'

const sleep = (msec: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

;(async () => {
  const canvasKit = await CanvasKitInit()
  const ssd1306 = await Ssd1306.openDevice()
  await ssd1306.init()

  process.once('SIGINT', () => {
    ssd1306
      .close()
      .then(() => process.exit())
      .catch((e) => {
        console.log(e)
      })
  })

  const canvas = canvasKit.MakeCanvas(ssd1306.width, ssd1306.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  while (true) {
    drawClock(ctx)
    const image = ctx.getImageData(0, 0, ssd1306.width, ssd1306.height)
    await ssd1306.draw(ImageUtil.dithering(image))
    await sleep(1000)
  }
})()
