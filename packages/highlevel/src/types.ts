import { TypedEventTarget, MonoTypedEventTarget } from '@node-pigpio/util'

export const GpioNameTuple = [
  'GPIO0',
  'GPIO1',
  'GPIO2',
  'GPIO3',
  'GPIO4',
  'GPIO5',
  'GPIO6',
  'GPIO7',
  'GPIO8',
  'GPIO9',
  'GPIO10',
  'GPIO11',
  'GPIO12',
  'GPIO13',
  'GPIO14',
  'GPIO15',
  'GPIO16',
  'GPIO17',
  'GPIO18',
  'GPIO19',
  'GPIO20',
  'GPIO21',
  'GPIO22',
  'GPIO23',
  'GPIO24',
  'GPIO25',
  'GPIO26',
  'GPIO27',
  'GPIO28',
  'GPIO29',
  'GPIO30',
  'GPIO31',
] as const
export type GpioName = typeof GpioNameTuple[number]

export const EventNameTuple = [
  'EVENT0',
  'EVENT1',
  'EVENT2',
  'EVENT3',
  'EVENT4',
  'EVENT5',
  'EVENT6',
  'EVENT7',
  'EVENT8',
  'EVENT9',
  'EVENT10',
  'EVENT11',
  'EVENT12',
  'EVENT13',
  'EVENT14',
  'EVENT15',
  'EVENT16',
  'EVENT17',
  'EVENT18',
  'EVENT19',
  'EVENT20',
  'EVENT21',
  'EVENT22',
  'EVENT23',
  'EVENT24',
  'EVENT25',
  'EVENT26',
  'EVENT27',
  'EVENT28',
  'EVENT29',
  'EVENT30',
  'EVENT_BSC',
] as const
export type EventName = typeof EventNameTuple[number]

export const GpioModeTuple = [
  'INPUT',
  'OUTPUT',
  'ALT5',
  'ALT4',
  'ALT0',
  'ALT1',
  'ALT2',
  'ALT3',
] as const
export type GpioMode =
  | 'INPUT'
  | 'OUTPUT'
  | 'ALT0'
  | 'ALT1'
  | 'ALT2'
  | 'ALT3'
  | 'ALT4'
  | 'ALT5'

export type PullUpDownType = 'OFF' | 'DOWN' | 'UP'

export interface GpioEdgeEvent {
  level: 0 | 1 | 'TIMEOUT'
  tick: number
}
export interface GpioEvent {
  tick: number
}

export type GpioEventArgsType = {
  edge: GpioEdgeEvent
  fallingEdge: GpioEdgeEvent
  risingEdge: GpioEdgeEvent
}
export type GpioEventNameType = keyof GpioEventArgsType

export type GpioEdgeType = 'edge' | 'risingEdge' | 'fallingEdge'

/** Gpio */
export interface Gpio extends TypedEventTarget<GpioEventArgsType> {
  setServoPulsewidth(pulsewidth: number): Promise<void>
  getServoPulsewidth(): Promise<number>

  setPWMFrequency(frequency: number): Promise<void>
  getPWMFrequency(): Promise<number>

  setPWMDutycycle(dutycycle: number): Promise<void>
  getPWMDutycycle(): Promise<number>

  setPWMRange(range: number): Promise<void>
  getPWMRealRange(): Promise<number>
  getPWMRange(): Promise<number>

  setMode(mode: GpioMode): Promise<void>
  getMode(): Promise<GpioMode>
  setPullUpDown(pud: PullUpDownType): Promise<void>
  write(level: 0 | 1): Promise<void>
  read(): Promise<0 | 1>

  waitForEdge(edge: GpioEdgeType, timeout?: number): Promise<boolean>

  close(): Promise<void>
  readonly closeEvent: MonoTypedEventTarget<void>

  readonly pin: number
}

export type I2cZipCommand =
  | { type: 'Write'; data: Buffer }
  | { type: 'Read'; size: number }

/** I2C */
export interface I2c {
  /** write data to I2C device */
  writeDevice(data: Buffer): Promise<void>
  /** read data from I2C device */
  readDevice(count: number): Promise<Buffer>
  /** zipped command for I2C read/writes */
  zip(...commands: I2cZipCommand[]): Promise<Buffer[]>
  close(): Promise<void>
  readonly closeEvent: MonoTypedEventTarget<void>
}

/** Open with hardware I2C. */
export type I2COption = { bus: number; address: number; flags?: number }

/** Open with Bit baning I2C. */
export type BBI2COption = {
  sda: number
  scl: number
  address: number
  baudRate: number
}

/** Spi */
export interface Spi {
  /** write data to Spi device */
  writeDevice(data: Buffer): Promise<void>
  /** read data from Spi device */
  readDevice(count: number): Promise<Buffer>
  xferDevice(data: Buffer): Promise<Buffer | undefined>
  close(): Promise<void>
  readonly closeEvent: MonoTypedEventTarget<void>
}

/** Open with hardware SPI. */
export type SpiOption = {
  channel: number
  baudRate: number
  flags?: number
}

/** Open with Bit baning SPI. */
export type BBSpiOption = {
  cs: number
  miso: number
  mosi: number
  sclk: number
  baudRate: number
  flags?: number
}

/**
 * High level pigpio interface
 */
export interface Pigpio {
  /** get gpio interface */
  gpio(no: number): Gpio
  /** get i2c interface */
  i2c(option: I2COption | BBI2COption): Promise<I2c>
  /** get spi interface */
  spi(option: SpiOption | BBSpiOption): Promise<Spi>
  /** close pigpio  */
  close(): Promise<void>

  /** pigpio event  */
  readonly event: TypedEventTarget<{ [K in EventName]: GpioEvent }>

  /** trigger pigpio event  */
  eventTrigger(event: EventName): Promise<void>

  /** notify event when closed this interface */
  readonly closeEvent: MonoTypedEventTarget<void>

  /** get current tick  */
  getCurrentTick(): Promise<number>
  /** get raspberry pi hardware rivision  */
  getHardwareRevision(): Promise<number>
  /** get pigpio library version */
  getPigpioVersion(): Promise<number>
}
