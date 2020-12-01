import { EventEmitter } from 'events'
import {
  BBI2COption,
  BBSpiOption,
  Gpio,
  I2c,
  I2COption,
  Pigpio,
  Spi,
  SpiOption,
  GpioEdgeType,
  GpioEventArgsType,
  GpioMode,
  PullUpDownType,
} from '@node-pigpio/highlevel'
import { MonoTypedEventEmitter } from '@node-pigpio/util'

export class StubPigpio implements Pigpio {
  gpio(no: number): Gpio {
    throw new Error('Method not implemented.')
  }
  i2c(option: I2COption | BBI2COption): Promise<I2c> {
    throw new Error('Method not implemented.')
  }
  spi(option: SpiOption | BBSpiOption): Promise<Spi> {
    throw new Error('Method not implemented.')
  }
  close(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  eventTrigger(
    event:
      | 'EVENT0'
      | 'EVENT1'
      | 'EVENT2'
      | 'EVENT3'
      | 'EVENT4'
      | 'EVENT5'
      | 'EVENT6'
      | 'EVENT7'
      | 'EVENT8'
      | 'EVENT9'
      | 'EVENT10'
      | 'EVENT11'
      | 'EVENT12'
      | 'EVENT13'
      | 'EVENT14'
      | 'EVENT15'
      | 'EVENT16'
      | 'EVENT17'
      | 'EVENT18'
      | 'EVENT19'
      | 'EVENT20'
      | 'EVENT21'
      | 'EVENT22'
      | 'EVENT23'
      | 'EVENT24'
      | 'EVENT25'
      | 'EVENT26'
      | 'EVENT27'
      | 'EVENT28'
      | 'EVENT29'
      | 'EVENT30'
      | 'EVENT_BSC'
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getCurrentTick(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  getHardwareRevision(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  getPigpioVersion(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  readonly closeEvent = new MonoTypedEventEmitter<void>()
  event = new EventEmitter()
}

export class StubGpio implements Gpio {
  setServoPulsewidth(pulsewidth: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getServoPulsewidth(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  setPWMFrequency(frequency: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getPWMFrequency(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  setPWMDutycycle(dutycycle: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getPWMDutycycle(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  setPWMRange(range: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getPWMRealRange(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  getPWMRange(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  setMode(mode: GpioMode): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getMode(): Promise<GpioMode> {
    throw new Error('Method not implemented.')
  }
  setPullUpDown(pud: PullUpDownType): Promise<void> {
    throw new Error('Method not implemented.')
  }
  write(level: 0 | 1): Promise<void> {
    throw new Error('Method not implemented.')
  }
  read(): Promise<0 | 1> {
    throw new Error('Method not implemented.')
  }
  waitForEdge(edge: GpioEdgeType, timeout?: number): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  addListener<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    throw new Error('Method not implemented.')
  }
  on<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    throw new Error('Method not implemented.')
  }
  once<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    throw new Error('Method not implemented.')
  }
  removeListener<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    throw new Error('Method not implemented.')
  }
  off<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    throw new Error('Method not implemented.')
  }
  close(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  readonly closeEvent = new MonoTypedEventEmitter<void>()
  readonly pin = 0
}
