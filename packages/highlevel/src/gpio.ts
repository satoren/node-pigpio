import * as pigpio from '@node-pigpio/core'

import {
  Gpio,
  GpioMode,
  GpioModeTuple,
  PullUpDownType,
  GpioEdgeEvent,
  GpioEdgeType,
  GpioEventArgsType,
} from './types'
import { MonoTypedEventEmitter } from '@node-pigpio/util'

const PullUpDownTypeTuple = ['OFF', 'DOWN', 'UP'] as const

class Callbacks {
  private callbacks = new Map<
    (args: GpioEdgeEvent) => void,
    Map<number, pigpio.Event>
  >()

  put(
    edge: number,
    listener: (args: GpioEdgeEvent) => void,
    callback: pigpio.Event
  ) {
    const l = this.callbacks.get(listener)
    if (l) {
      l.set(edge, callback)
    } else {
      this.callbacks.set(listener, new Map([[edge, callback]]))
    }
  }

  get(
    edge: number,
    listener: (args: GpioEdgeEvent) => void
  ): pigpio.Event | undefined {
    return this.callbacks.get(listener)?.get(edge)
  }

  delete(edge: number, listener: (args: GpioEdgeEvent) => void): void {
    this.callbacks.get(listener)?.delete(edge)
  }

  getAll(): pigpio.Event[] {
    const ret: pigpio.Event[] = []
    for (const m of this.callbacks.values()) {
      for (const event of m.values()) {
        ret.push(event)
      }
    }
    return ret
  }

  deleteAll(): void {
    this.callbacks.clear()
  }
}

function edgeValue(n: GpioEdgeType) {
  switch (n) {
    case 'edge':
      return pigpio.EITHER_EDGE
    case 'risingEdge':
      return pigpio.RISING_EDGE
    case 'fallingEdge':
      return pigpio.FALLING_EDGE
  }
}

class GpioImpl implements Gpio {
  private callbacks = new Callbacks()
  readonly closeEvent = new MonoTypedEventEmitter<void>()
  private gpio: number
  private pi: pigpio.pigpio
  constructor(gpio: number, pi: pigpio.pigpio) {
    this.gpio = gpio
    this.pi = pi
  }

  addListener<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    this.appendCallback(event, listener)
    return this
  }

  on<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    return this.addListener(event, listener)
  }

  once<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    this.appendCallback(event, listener, true)
    return this
  }

  removeListener<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    this.removeCallback(event, listener)
    return this
  }

  off<E extends GpioEdgeType>(
    event: E,
    listener: (args: GpioEventArgsType[E]) => void
  ): this {
    return this.removeListener(event, listener)
  }

  appendCallback(
    edge: GpioEdgeType,
    listener: (args: GpioEdgeEvent) => void,
    once = false
  ) {
    const v = edgeValue(edge)
    const c = this.pi.callback(this.gpio, v, (_, level, tick): void => {
      listener({ level, tick })
      if (once) {
        this.removeCallback(edge, listener)
      }
    })
    this.callbacks.put(v, listener, c)
  }

  removeCallback(edge: GpioEdgeType, listener: (args: GpioEdgeEvent) => void) {
    const v = edgeValue(edge)
    const c = this.callbacks.get(v, listener)
    c?.cancel()
    this.callbacks.delete(v, listener)
  }

  removeAllCallback() {
    this.callbacks.getAll().forEach((e) => {
      e?.cancel()
    })
    this.callbacks.deleteAll()
  }

  async setServoPulsewidth(pulsewidth: number): Promise<void> {
    await this.pi.set_servo_pulsewidth(this.gpio, pulsewidth)
  }

  async getServoPulsewidth(): Promise<number> {
    return await this.pi.get_servo_pulsewidth(this.gpio)
  }

  async setPWMFrequency(frequency: number): Promise<void> {
    await this.pi.set_PWM_frequency(this.gpio, frequency)
  }

  async getPWMFrequency(): Promise<number> {
    return await this.pi.get_PWM_frequency(this.gpio)
  }

  async setPWMDutycycle(dutycycle: number): Promise<void> {
    await this.pi.set_PWM_dutycycle(this.gpio, dutycycle)
  }

  async getPWMDutycycle(): Promise<number> {
    return await this.pi.get_PWM_dutycycle(this.gpio)
  }

  async setPWMRange(range: number): Promise<void> {
    await this.pi.set_PWM_range(this.gpio, range)
  }

  async getPWMRealRange(): Promise<number> {
    return await this.pi.get_PWM_real_range(this.gpio)
  }

  async getPWMRange(): Promise<number> {
    return await this.pi.get_PWM_range(this.gpio)
  }

  async setMode(modeName: GpioMode): Promise<void> {
    const mode = GpioModeTuple.findIndex((m) => m === modeName)
    if (mode < 0) {
      throw new Error('Invalid argument')
    }

    await this.pi.set_mode(this.gpio, mode)
  }

  async getMode(): Promise<GpioMode> {
    const res = await this.pi.get_mode(this.gpio)
    const mode = GpioModeTuple[res]
    if (mode) {
      return mode
    }
    throw new Error('Unknown mode error')
  }

  async setPullUpDown(pudName: PullUpDownType): Promise<void> {
    const pud = PullUpDownTypeTuple.findIndex((m) => m === pudName)
    if (pud < 0) {
      throw new Error('Invalid argument')
    }
    await this.pi.set_pull_up_down(this.gpio, pud)
  }

  async write(level: 0 | 1): Promise<void> {
    await this.pi.write(this.gpio, level)
  }

  async read(): Promise<0 | 1> {
    const res = await this.pi.read(this.gpio)
    if (res === 0 || res === 1) {
      return res
    }
    throw new Error('Unknown level error')
  }

  async waitForEdge(edge: GpioEdgeType, timeout?: number): Promise<boolean> {
    return this.pi.wait_for_edge(this.gpio, edgeValue(edge), timeout)
  }

  get pin(): number {
    return this.gpio
  }

  async close(): Promise<void> {
    this.removeAllCallback()
    await this.closeEvent.emit()
  }
}

export const createGpio = (gpio: number, pi: pigpio.pigpio): Gpio =>
  new GpioImpl(gpio, pi)

export default { createGpio }
