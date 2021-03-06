import { createCanvas } from 'canvas'
import { Ssd1331 } from '@node-pigpio/devices-display'
import { drawClock } from './draw-clock'

const sleep = (msec: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, msec))
}
;(async () => {
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

  const canvas = createCanvas(ssd1331.width, ssd1331.height)
  const ctx = canvas.getContext('2d', { pixelFormat: 'RGB16_565' })
  while (true) {
    drawClock(ctx)
    await ssd1331.draw(canvas.toBuffer('raw'))
    await sleep(1000)
  }
})()
