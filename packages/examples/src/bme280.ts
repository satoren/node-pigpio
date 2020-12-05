import {once} from 'events'
import { BME280 } from '@node-pigpio/devices-sensor'
;(async () => {
  const bme280 = await BME280()

  process.once('SIGINT', () => {
    void bme280.close()
  })
  bme280.on('data', (data) => {
    console.log(data)
  })
  bme280.on('error', (err) => {
    console.log(err)
  })
})()
