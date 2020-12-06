import { Ssd1331 } from '@node-pigpio/devices-display'
import { init as CanvasKitInit } from './canvaskit-node-support'
import { drawClock } from './draw-clock'

const sleep = (msec: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

;(async () => {
  const canvasKit = await CanvasKitInit()
  const ssd1331 = await Ssd1331.openDevice()
  await ssd1331.init()

  process.once('SIGINT', () => {
    ssd1331
      .close()
      .then(() => process.exit())
      .catch((e) => {
        console.log(e)
      })
  })

  const canvas = canvasKit.MakeCanvas(ssd1331.width, ssd1331.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  while (true) {
    drawClock(ctx)
    const image = ctx.getImageData(0, 0, ssd1331.width, ssd1331.height)
    await ssd1331.draw(image)
    await sleep(1000)
  }
})()
