import { BME280 } from '@node-pigpio/devices-sensor'
;(async () => {
  const bme280 = await BME280({ i2cOption: { bus: 1, address: 0x77 } })

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
