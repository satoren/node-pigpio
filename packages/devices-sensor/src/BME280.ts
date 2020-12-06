import { EventEmitter, on } from 'events'

import {
  Pigpio,
  I2c,
  I2COption,
  BBI2COption,
  defaultFactory,
} from '@node-pigpio/highlevel'
import {
  AsyncTaskScheduler,
  CancelableTask,
  Sleepable,
  CanceledError,
  TypedEventTarget,
} from '@node-pigpio/util'

const defaultAddress = 0x76 // or 0x77

enum RegisterAddress {
  DIG_T1 = 0x88,
  DIG_T2 = 0x8a,
  DIG_T3 = 0x8c,
  DIG_P1 = 0x8e,
  DIG_P2 = 0x90,
  DIG_P3 = 0x92,
  DIG_P4 = 0x94,
  DIG_P5 = 0x96,
  DIG_P6 = 0x98,
  DIG_P7 = 0x9a,
  DIG_P8 = 0x9c,
  DIG_P9 = 0x9e,
  DIG_H1 = 0xa1,
  DIG_H2 = 0xe1,
  DIG_H3 = 0xe3,
  DIG_H4 = 0xe4,
  DIG_H5 = 0xe5,
  DIG_H6 = 0xe7,
  HW_ID = 0xd0,
  SW_RESET = 0xe0,
  CONTROL_HUMIDITY = 0xf2,
  STATUS = 0xf3,
  CONTROL = 0xf4,
  CONFIG = 0xf5,
  PRESSURE = 0xf7,
  TEMPERATURE = 0xfa,
  HUMIDITY = 0xfd,
}

interface CalibrationData {
  digT1: number
  digT2: number
  digT3: number
  digP1: number
  digP2: number
  digP3: number
  digP4: number
  digP5: number
  digP6: number
  digP7: number
  digP8: number
  digP9: number
  digH1: number
  digH2: number
  digH3: number
  digH4: number
  digH5: number
  digH6: number
}

export type StandbyMilliSeconds = 0.5 | 62.5 | 125 | 250 | 500 | 1000 | 10 | 20

export type Mode = 'Sleep' | 'Forced' | 'Normal'

export enum Filter {
  Off = 0,
  X1 = 1,
  X2 = 2,
  X4 = 3,
  X8 = 4,
  X16 = 5,
}

export enum Sampling {
  None = 0,
  X1 = 1,
  X2 = 2,
  X4 = 3,
  X8 = 4,
  X16 = 5,
}
export interface SamplingOption {
  temperatureSampling: Sampling
  pressureSampling: Sampling
  humiditySampling: Sampling
  mode: Mode
}

export type MeasureData = {
  /** DegC */
  temperature: number
  /** Pa */
  pressure: number
  /** represents */
  humidity: number
}
export interface BME280
  extends TypedEventTarget<{ data: MeasureData; error: Error }> {
  start(): Promise<void>
  stop(): void
  close(): Promise<void>
  readonly temperature: number | undefined
  readonly pressure: number | undefined
  readonly humidity: number | undefined
  readonly error: string | undefined

  setSamplingOption(option: SamplingOption): Promise<void>

  setFilter(coefficients: Filter): Promise<void>
  setStandbyTime(ms: StandbyMilliSeconds): Promise<void>

  [Symbol.asyncIterator](): AsyncIterator<MeasureData>
}
const openI2c = async (i2cOption: I2COption | BBI2COption, gpio?: Pigpio) => {
  return await (gpio ?? (await defaultFactory.get())).i2c(i2cOption)
}

type Option = { i2cOption?: I2COption | BBI2COption; gpio?: Pigpio; i2c?: I2c }
export const BME280 = async (option?: Option): Promise<BME280> => {
  const { i2cOption = { address: defaultAddress, bus: 1 }, gpio } = option ?? {}
  const i2c = option?.i2c ?? (await openI2c(i2cOption, gpio))

  const readByte = async (cmd: RegisterAddress): Promise<number> => {
    const [[data]] = await i2c.zip(
      { type: 'Write', data: Buffer.from([cmd]) },
      { type: 'Read', size: 1 }
    )
    return data
  }
  const writeByte = async (
    cmd: RegisterAddress,
    byte: number
  ): Promise<void> => {
    return i2c.writeDevice(Buffer.from([cmd, byte]))
  }
  const readUInt16LE = async (cmd: RegisterAddress): Promise<number> => {
    return (await readData(cmd, 2)).readUInt16LE()
  }
  const readUInt16BE = async (cmd: RegisterAddress): Promise<number> => {
    return (await readData(cmd, 2)).readUInt16BE()
  }
  const readUInt24BE = async (cmd: RegisterAddress): Promise<number> => {
    const v = await readData(cmd, 3)
    return (v[0] << 16) | (v[1] << 8) | v[2]
  }

  const readInt16LE = async (cmd: RegisterAddress): Promise<number> => {
    return (await readData(cmd, 2)).readInt16LE()
  }
  const readData = async (
    cmd: RegisterAddress,
    size: number
  ): Promise<Buffer> => {
    const [data] = await i2c.zip(
      { type: 'Write', data: Buffer.from([cmd]) },
      { type: 'Read', size: size }
    )
    return data
  }

  const toSInt8 = (n: number) => {
    const sign = n & (1 << 7)
    return (n & 0x7f) * (sign !== 0 ? -1 : 1)
  }

  const standbyMilliSecondsValue = (
    milliseconds: StandbyMilliSeconds
  ): number => {
    switch (milliseconds) {
      case 0.5:
        return 0
      case 62.5:
        return 1
      case 125:
        return 2
      case 250:
        return 3
      case 500:
        return 4
      case 1000:
        return 5
      case 10:
        return 6
      case 20:
        return 7
      default:
        throw Error('Invalid argument: standbyTime')
    }
  }
  const modeValue = (mode: Mode): number => {
    switch (mode) {
      case 'Forced':
        return 1
      case 'Sleep':
        return 0
      case 'Normal':
        return 3
      default:
        throw Error('Invalid argument: standbyTime')
    }
  }

  const readTFine = async (): Promise<number | undefined> => {
    const adcT = (await readUInt24BE(RegisterAddress.TEMPERATURE)) >> 4

    if (adcT === 0x80000) {
      return undefined
    }

    const var1 =
      (adcT / 16384.0 - calibrationData.digT1 / 1024.0) * calibrationData.digT2
    const var2 =
      (adcT / 131072.0 - calibrationData.digT1 / 8192.0) *
      (adcT / 131072.0 - calibrationData.digT1 / 8192.0) *
      calibrationData.digT3

    return var1 + var2
  }
  const readPressure = async (tFine: number): Promise<number | undefined> => {
    const adcP = (await readUInt24BE(RegisterAddress.PRESSURE)) >> 4

    if (adcP === 0x80000) {
      return undefined
    }
    let var1 = tFine / 2.0 - 64000.0
    let var2 = (var1 * var1 * calibrationData.digP6) / 32768.0
    var2 = var2 + var1 * calibrationData.digP5 * 2.0
    var2 = var2 / 4.0 + calibrationData.digP4 * 65536.0
    var1 =
      ((calibrationData.digP3 * var1 * var1) / 524288.0 +
        calibrationData.digP2 * var1) /
      524288.0
    var1 = (1.0 + var1 / 32768.0) * calibrationData.digP1
    if (var1 === 0) {
      return undefined // avoid exception caused by division by zero
    }
    let p = 1048576.0 - adcP
    p = ((p - var2 / 4096.0) * 6250.0) / var1
    var1 = (calibrationData.digP9 * p * p) / 2147483648.0
    var2 = (p * calibrationData.digP8) / 32768.0
    p = p + (var1 + var2 + calibrationData.digP7) / 16.0
    return p
  }

  const readHumidity = async (tFine: number): Promise<number | undefined> => {
    const adcH = await readUInt16BE(RegisterAddress.HUMIDITY)

    if (adcH === 0x80000) {
      return undefined
    }
    let varH = tFine - 76800.0
    varH =
      (adcH -
        (calibrationData.digH4 * 64.0 +
          (calibrationData.digH5 / 16384.0) * varH)) *
      ((calibrationData.digH2 / 65536.0) *
        (1.0 +
          (calibrationData.digH6 / 67108864.0) *
            varH *
            (1.0 + (calibrationData.digH3 / 67108864.0) * varH)))
    varH = varH * (1.0 - (calibrationData.digH1 * varH) / 524288.0)
    if (varH > 100.0) varH = 100.0
    else if (varH < 0.0) varH = 0.0
    return varH
  }

  let temperature: number | undefined
  let pressure: number | undefined
  let humidity: number | undefined
  let error: string | undefined
  let stanbyTime: StandbyMilliSeconds = 1000
  let calibrationData: CalibrationData
  const task = new AsyncTaskScheduler()

  const sleep = (msec: number) => {
    return new Promise((resolve) => setTimeout(resolve, msec))
  }

  const readCalibrationData = async (): Promise<CalibrationData> => {
    const digT1 = await readUInt16LE(RegisterAddress.DIG_T1)
    const digT2 = await readInt16LE(RegisterAddress.DIG_T2)
    const digT3 = await readInt16LE(RegisterAddress.DIG_T3)

    const digP1 = await readUInt16LE(RegisterAddress.DIG_P1)
    const digP2 = await readInt16LE(RegisterAddress.DIG_P2)
    const digP3 = await readInt16LE(RegisterAddress.DIG_P3)
    const digP4 = await readInt16LE(RegisterAddress.DIG_P4)
    const digP5 = await readInt16LE(RegisterAddress.DIG_P5)
    const digP6 = await readInt16LE(RegisterAddress.DIG_P6)
    const digP7 = await readInt16LE(RegisterAddress.DIG_P7)
    const digP8 = await readInt16LE(RegisterAddress.DIG_P8)
    const digP9 = await readInt16LE(RegisterAddress.DIG_P9)

    const digH1 = await readByte(RegisterAddress.DIG_H1)
    const digH2 = await readInt16LE(RegisterAddress.DIG_H2)
    const digH3 = await readByte(RegisterAddress.DIG_H3)
    const digH4LSB = await readByte(RegisterAddress.DIG_H4)
    const digH4MSB = await readByte(RegisterAddress.DIG_H4 + 1)
    const digH4 = (digH4LSB << 4) | (digH4MSB & 0xf)
    const digH5LSB = await readByte(RegisterAddress.DIG_H5)
    const digH5MSB = await readByte(RegisterAddress.DIG_H5 + 1)
    const digH5 = (digH5MSB << 4) | (digH5LSB >> 4)
    const digH6 = toSInt8(await readByte(RegisterAddress.DIG_H6))

    return {
      digT1,
      digT2,
      digT3,
      digP1,
      digP2,
      digP3,
      digP4,
      digP5,
      digP6,
      digP7,
      digP8,
      digP9,
      digH1,
      digH2,
      digH3,
      digH4,
      digH5,
      digH6,
    }
  }

  const bme280 = new (class extends EventEmitter {
    start(): Promise<void> {
      const interval = stanbyTime
      const measureTask: CancelableTask = Sleepable(
        (sleep): CancelableTask => () => {
          let cancel: () => void
          const promise = new Promise<void>((resolve, reject) => {
            let canceled = false
            cancel = () => {
              canceled = true
              resolve()
            }
            ;(async () => {
              try {
                while (true) {
                  if (canceled) {
                    return
                  }
                  try {
                    await this.measure()
                  } catch (e) {
                    console.error(e)
                  }
                  await sleep(interval)
                }
              } catch (e) {
                if (e instanceof CanceledError) {
                  resolve()
                } else {
                  reject(e)
                }
              }
            })()
          })
          return { promise, cancel: () => cancel() }
        }
      )
      return task.start(measureTask)
    }

    stop(): void {
      task.stop()
    }

    async setStandbyTime(ms: StandbyMilliSeconds): Promise<void> {
      if (stanbyTime === ms) {
        return
      }
      stanbyTime = ms
      await this.updateStandbyTime()
    }

    async updateStandbyTime(): Promise<void> {
      let newMode = await readByte(RegisterAddress.CONFIG)
      newMode &= ~(0b00000111 << 5)
      newMode |= standbyMilliSecondsValue(stanbyTime) << 5
      await writeByte(RegisterAddress.CONFIG, newMode)

      if (task.running()) {
        await this.start()
      }
    }

    async setFilter(coefficients: Filter): Promise<void> {
      let newMode = await readByte(RegisterAddress.CONFIG)
      newMode &= ~(0b00000111 << 2)
      newMode |= coefficients << 2
      await writeByte(RegisterAddress.CONFIG, newMode)
    }

    async setSamplingOption(option: SamplingOption): Promise<void> {
      // Config is only writable in sleep mode
      await writeByte(RegisterAddress.CONTROL, modeValue('Sleep'))

      await writeByte(RegisterAddress.CONTROL_HUMIDITY, option.humiditySampling)

      const newControl =
        ((option.temperatureSampling & 0x7) << 5) |
        ((option.pressureSampling & 0x7) << 2) |
        modeValue(option.mode)

      await writeByte(RegisterAddress.CONTROL, newControl)
    }

    softReset(): Promise<void> {
      return writeByte(RegisterAddress.SW_RESET, 0xb6)
    }

    close() {
      this.stop()
      return i2c.close()
    }

    get temperature() {
      return temperature
    }

    get pressure() {
      return pressure
    }

    get humidity() {
      return humidity
    }

    get error() {
      return error
    }

    async setup() {
      // setup

      const hardwareId = await readByte(RegisterAddress.HW_ID)

      if (![0x56, 0x57, 0x58, 0x60].includes(hardwareId)) {
        throw Error('BME/BMP280 not found.')
      }

      await this.softReset()
      await sleep(10)

      calibrationData = await readCalibrationData()
      // setting up to default.
      await this.updateStandbyTime()
      await this.setSamplingOption({
        pressureSampling: Sampling.X1,
        humiditySampling: Sampling.X1,
        temperatureSampling: Sampling.X1,
        mode: 'Normal',
      })

      if (this.listenerCount('data') > 0 && !task.running()) {
        this.start().catch((err) => this.emit(err))
      }
      this.on('newListener', (event) => {
        if (event === 'data' && !task.running()) {
          this.start().catch((err) => this.emit(err))
        }
      })
      this.on('removeListener', () => {
        if (this.listenerCount('data') === 0 && task.running()) {
          this.stop()
        }
      })
    }

    async measure(): Promise<void> {
      const tfine = await readTFine()
      if (tfine == null) {
        return
      }

      const newTemp = tfine / 5120
      const newPressure = (await readPressure(tfine)) ?? pressure
      const newHumidity = (await readHumidity(tfine)) ?? humidity
      if (
        temperature !== newTemp ||
        pressure !== newPressure ||
        humidity !== newHumidity
      ) {
        temperature = newTemp
        pressure = newPressure
        humidity = newHumidity

        this.emit('data', { temperature, pressure, humidity })
      }
    }

    async *[Symbol.asyncIterator]() {
      for await (const data of on(this, 'data')) {
        yield data
      }
    }
  })()

  await bme280.setup()

  return bme280
}
