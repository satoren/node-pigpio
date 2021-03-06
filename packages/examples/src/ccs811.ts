import { CCS811 } from '@node-pigpio/devices-sensor'
;(async () => {
  const bbi2c = {
    i2cOption: { sda: 22, scl: 27, address: 0x5a, baudRate: 115200 },
  }
  const ccs811 = await CCS811(bbi2c)
  process.once('SIGINT', () => {
    void ccs811.close()
  })
  ccs811.on('data', (data) => {
    console.log(data)
  })
  ccs811.on('error', (err) => {
    console.log(err)
  })
})()
