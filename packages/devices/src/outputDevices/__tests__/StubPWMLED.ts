import { PWMLED, BlinkOption, PulseOption } from '../PWMLED'

export class StubPWMLED implements PWMLED {
  blink(param: BlinkOption): Promise<void> {
    throw new Error('Method not implemented.')
  }
  pulse(param: PulseOption): Promise<void> {
    throw new Error('Method not implemented.')
  }
  setFrequency(frequency: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getFrequency(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  on(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  off(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  toggle(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  isLit(): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  setValue(value: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getValue(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  close(): void {
    throw new Error('Method not implemented.')
  }
  constructor(readonly pin: number) {}
}
