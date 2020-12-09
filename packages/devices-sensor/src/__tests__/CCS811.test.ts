import { CCS811 } from '../'
import { I2c, I2cZipCommand } from '@node-pigpio/highlevel'
import { once } from 'events'
import { MonoTypedEventEmitter } from '@node-pigpio/util'

beforeEach(() => {
  jest.clearAllMocks()
})

const writeDevice = jest.fn()
const readDevice = jest.fn()
const zip = jest.fn()
const close = jest.fn()
const mockI2c: I2c = {
  writeDevice,
  readDevice,
  zip,
  close,
  closeEvent: new MonoTypedEventEmitter<void>(),
}
test('using', async () => {
  zip.mockImplementation((reg: I2cZipCommand) => {
    if (reg.type === 'Write') {
      switch (reg.data[0]) {
        case 0x20:
          return [Uint8Array.from([0x81])]
        case 0x0:
          return [Uint8Array.from([(1 << 4) | (1 << 3)])]
        case 0x02:
          return [Uint8Array.of(2, 1, 2, 1, (1 << 4) | (1 << 3), 0, 0, 0)]
      }
    }
    return [Uint8Array.from([0x81])]
  })
  const ccs811 = await CCS811({ i2c: mockI2c })

  const data = await once(ccs811, 'data')
  expect(data).toMatchObject([{ CO2: 513, tVOC: 513 }])
})
