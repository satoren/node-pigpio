import { EventEmitter } from 'events'

import { Pigpio, I2c, I2COption, BBI2COption, defaultFactory } from '@node-pigpio/highlevel'
import { AsyncTaskScheduler, CancelableTask, Sleepable, CanceledError, TypedEventTarget } from '@node-pigpio/util'

const defaultAddress = 0x5A

enum RegisterAddress {
    STATUS = 0x00,
    MEAS_MODE = 0x01,
    ALG_RESULT_DATA = 0x02,
    RAW_DATA = 0x03,
    ENV_DATA = 0x05,
    NTC = 0x06,
    THRESHOLDS = 0x10,
    BASELINE = 0x11,
    HW_ID = 0x20,
    HW_VERSION = 0x21,
    FW_BOOT_VERSION = 0x23,
    FW_APP_VERSION = 0x24,
    ERROR_ID = 0xE0,
    APP_START = 0xF4,
    SW_RESET = 0xFF,
}

export type DriveMode = 'IDLE' | 'EverySecond'| 'Every10Seconds'| 'Every60Seconds'| 'Every250MilliSeconds'
type MeasureData = { CO2: number, tVOC: number }
export interface CCS811 extends TypedEventTarget<{data:MeasureData, error: Error }>{

    setDriveMode(mode: DriveMode): Promise<void>
    setEnviromentData(humidity: number, temperture: number): Promise<void>

    start(): Promise<void>
    stop(): void
    close(): Promise<void>
    readonly CO2: number | undefined
    readonly tVOC: number | undefined
    readonly error: string | undefined
}
const openI2c = async (ic2option: (I2COption | BBI2COption), gpio?: Pigpio) => {
    return await (gpio ?? await defaultFactory.get()).i2c(ic2option)
}

type Option = {ic2option?: (I2COption | BBI2COption), gpio?: Pigpio, i2c?: I2c }
export const CCS811 = async (option? : Option): Promise<CCS811> => {
    const { ic2option = { address: defaultAddress, bus: 1 }, gpio } = option ?? {}
    const i2c = option?.i2c ?? await openI2c(ic2option, gpio)

    const readByte = async (cmd: RegisterAddress): Promise<number> => {
        const [[data]] = await i2c.zip({ type: 'Write', data: Buffer.from([cmd]) }, { type: 'Read', size: 1 })
        return data
    }
    const readData = async (cmd: RegisterAddress, size: number): Promise<Buffer> => {
        const [data] = await i2c.zip({ type: 'Write', data: Buffer.from([cmd]) }, { type: 'Read', size: size })
        return data
    }

    const isValidCO2Value = (v:number): boolean => v >= 400 && v <= 29206
    const isValidTVOCValue = (v:number): boolean => v >= 0 && v <= 32767

    const modeValue = (): number => {
        switch (mode) {
            case 'IDLE':
                return 0
            case 'EverySecond':
                return 1
            case 'Every10Seconds':
                return 2
            case 'Every60Seconds':
                return 3
            case 'Every250MilliSeconds':
                return 4
        }
    }
    const measureInterval = (): number => {
        switch (mode) {
            case 'IDLE':
                return Infinity
            case 'EverySecond':
                return 1000
            case 'Every10Seconds':
                return 10000
            case 'Every60Seconds':
                return 60000
            case 'Every250MilliSeconds':
                return 250
        }
    }

    let CO2: number | undefined
    let tVOC: number | undefined
    let errorMessage: string | undefined
    let mode: DriveMode = 'IDLE'
    const task = new AsyncTaskScheduler()

    const sleep = (msec: number) => {
        return new Promise((resolve) => setTimeout(resolve, msec))
    }

    const ccs811 = new class extends EventEmitter {
        start (): Promise<void> {
            const interval = measureInterval()
            const measureTask: CancelableTask = Sleepable((sleep): CancelableTask => () => {
                let cancel: ()=> void
                const promise = new Promise<void>((resolve, reject) => {
                    let canceled = false
                    cancel = () => {
                        canceled = true
                        resolve()
                    }
                    (async () => {
                        try {
                            while (true) {
                                if (canceled) { return }
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
            })
            return task.start(measureTask)
        }

        stop (): void {
            task.stop()
        }

        async setDriveMode (m: DriveMode): Promise<void> {
            if (mode === m) { return }
            mode = m
            await this.updateMode()
        }

        async updateMode (): Promise<void> {
            let newMode = await readByte(RegisterAddress.MEAS_MODE)
            newMode &= ~(0b00000111 << 4)
            newMode |= (modeValue() << 4)
            await i2c.writeDevice(Buffer.from([RegisterAddress.MEAS_MODE, newMode]))

            if (task.running()) {
                await this.start()
            }
        }

        softReset (): Promise<void> {
            return i2c.writeDevice(Buffer.from([RegisterAddress.SW_RESET, 0x11, 0xE5, 0x72, 0x8A]))
        }

        async setEnviromentData (humidity: number, temperture: number): Promise<void> {
            const h = humidity * 1000
            const t = (temperture - 25) * 1000
            const hMSB = h >> 8 & 0xFF
            const hLSB = h & 0xFF
            const tMSB = t >> 8 & 0xFF
            const tLSB = t & 0xFF
            await i2c.writeDevice(Buffer.from([RegisterAddress.ENV_DATA,
                hMSB, hLSB, tMSB, tLSB
            ]))
        }

        close () {
            return i2c.close()
        }

        get CO2 () {
            return CO2
        }

        get tVOC () {
            return tVOC
        }

        get error () {
            return errorMessage
        }

        async setup () {
            // setup

            await this.softReset()
            await sleep(100)

            const hardwareId = await readByte(RegisterAddress.HW_ID)
            if (hardwareId !== 0x81) {
                throw Error('CCS811 not found.')
            }
            await this.checkForError()

            const appValid = await readByte(RegisterAddress.STATUS) & 1 << 4
            if (!appValid) {
                throw Error('App not valid.')
            }

            await i2c.writeDevice(Buffer.from([RegisterAddress.APP_START]))
            await this.checkForError()
            await this.setDriveMode('Every250MilliSeconds')

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

        async checkForError (status?: number, errorId?:number) {
            status = status ?? await readByte(RegisterAddress.STATUS)
            if (status & 1 << 0) {
                errorId = errorId ?? await readByte(RegisterAddress.ERROR_ID)
                if (errorId & 1 << 5) {
                    errorMessage = 'HEATER_SUPPLY: Soldering or PCB issue.'
                } else if (errorId & 1 << 4) {
                    errorMessage = 'HEATER_FAULT: Soldering, PCB issue or damage. '
                } else if (errorId & 1 << 3) {
                    errorMessage = 'MAX_RESISTANCE: The MOX material is no longer functioning as expected.'
                } else if (errorId & 1 << 2) {
                    errorMessage = 'MEASMODE_INVALID: The CCS811 received an I2C request to write an unsupported mode to MEAS_MODE '
                } else if (errorId & 1 << 1) {
                    errorMessage = 'READ_REG_INVALID: The CCS811 received an I2C read request to a mailbox ID that is invalid'
                } else if (errorId & 1 << 0) {
                    errorMessage = 'MSG_INVALID: The CCS811 received an I2C write request addressed to this station but with invalid mailbox ID or the wrong size '
                } else {
                    errorMessage = 'Unknown Error'
                }
                this.emit('error', Error(errorMessage))
            } else {
                errorMessage = undefined
            }
            return status & 1 << 0
        }

        async measure () {
            const [co2MSB, co2LSB, tvocMSB, tvocLSB, status, errorId] = await readData(RegisterAddress.ALG_RESULT_DATA, 8)
            if (status & 1 << 3) {
                const old = { CO2, tVOC }
                const newCO2 = (co2MSB << 8) | co2LSB
                const newTVOC = (tvocMSB << 8) | tvocLSB
                CO2 = isValidCO2Value(newCO2) ? newCO2 : CO2
                tVOC = isValidTVOCValue(newTVOC) ? newTVOC : tVOC
                if (old.CO2 !== CO2 || old.tVOC !== tVOC) {
                    ccs811.emit('data', { CO2, tVOC })
                }
            }
            await this.checkForError(status, errorId)
        }
    }()

    await ccs811.setup()

    return ccs811
}
