import { devices } from 'node-pigpio-if'
import CCS811 = devices.inputDevices.CCS811

(async () => {
    const bbi2c = { ic2option: { sda: 22, scl: 27, address: 0x5a, baudRate: 115200 } }
    const ccs811 = await CCS811(bbi2c)
    ccs811.on('data', (data) => {
        console.log(data)
    })
    ccs811.on('error', (err) => {
        console.log(err)
    })
    process.once('SIGINT', () => { void ccs811.close() })
})()
