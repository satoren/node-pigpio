import { createCanvas } from 'canvas'
import { Ssd1306 } from '@node-pigpio/devices-display'

import { drawClock } from './draw-clock'
const sleep = (msec: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

;(async () => {
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

  const canvas = createCanvas(ssd1306.width, ssd1306.height)
  const ctx = canvas.getContext('2d', { pixelFormat: 'A1' })
  while (true) {
    drawClock(ctx)
    await ssd1306.draw(canvas.toBuffer('raw'))
    await sleep(1000)
  }
})()
