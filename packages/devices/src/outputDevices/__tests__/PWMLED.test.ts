import { StubGpio, StubPigpio } from '../../__tests__/StubPigpio'
import { PWMLED } from '../'

jest.mock('../../__tests__/StubPigpio')

const mockedPigpio = new StubPigpio()
mockedPigpio.gpio = jest.fn((pin) => new StubGpio(pin))

const StubGpioMock = StubGpio as jest.MockedClass<typeof StubGpio>

const asMock = (func: unknown): jest.Mock => {
  return func as jest.Mock
}

let waitAfter = (msec: number) => {
  return new Promise<void>((resolve) => {
    setImmediate(() => {
      jest.advanceTimersByTime(msec)
      resolve()
    })
  })
}
beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
})
test('open', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  // initial value
  expect(mockedGpio.setMode).lastCalledWith('OUTPUT')
  expect(mockedGpio.setPWMRange).lastCalledWith(100)
  expect(mockedGpio.setPWMFrequency).lastCalledWith(100)
})
test('close', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  await led.close()
})
test('on', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  await led.on()
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
})
test('off', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  await led.off()
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(0)
})
test('isLit', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(100)
  expect(await led.isLit()).toBe(true)

  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(0)
  expect(await led.isLit()).toBe(false)
})
test('toggle', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(100)
  await led.toggle()
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(0)

  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(0)
  await led.toggle()
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)

  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(60)
  await led.toggle()
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(40)

  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(40)
  await led.toggle()
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(60)
})

test('setValue', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  await led.setValue(1)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
  await led.setValue(0.1)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(10)
  await led.setValue(0)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(0)
})
test('setValue over 1', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  await expect(led.setValue(14)).rejects.toThrow()
})
test('getValue', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(100)
  expect(await led.getValue()).toBe(1)

  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(10)
  expect(await led.getValue()).toBe(0.1)

  asMock(mockedGpio.getPWMDutycycle).mockReturnValueOnce(0)
  expect(await led.getValue()).toBe(0)
})
test('getFrequency', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  asMock(mockedGpio.getPWMFrequency).mockReturnValueOnce(100)
  expect(await led.getFrequency()).toBe(100)
})
test('blink', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(1000)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
  await waitAfter(2000)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(0)
  await waitAfter(1000)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
  await waitAfter(2000)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(0)
  await expect(blink).resolves.not.toThrow()
})
test('blink cancel', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(1000)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
  await waitAfter(2000)
  await led.blink({ repeat: 0 })
  await expect(blink).rejects.toThrow()
})
test('blink error', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(1000)
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)

  await waitAfter(2000)
  asMock(mockedGpio.setPWMDutycycle).mockImplementationOnce(() => {
    throw new Error('Test error')
  })
  await expect(blink).rejects.toThrow('Test error')
})

test('pulse', async () => {
  const led = await PWMLED(5, true, 1, 100, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  expect(mockedGpio.setPWMDutycycle).lastCalledWith(100)
  asMock(mockedGpio.setPWMDutycycle).mockClear()
  const blink = led.pulse({
    fadeInTime: 1000,
    fadeOutTime: 500,
    repeat: 2,
    fps: 10,
  })

  for (let i = 0; i < 30; i += 1) {
    await waitAfter(100)
  }
  await waitAfter(100)
  const expects = [
    0,
    10,
    20,
    30,
    40,
    50,
    60,
    70,
    80,
    90,
    100,
    80,
    60,
    40,
    19.999999999999996,
    0,
  ]
  expects.forEach((ex, index) => {
    expect.any
    expect(mockedGpio.setPWMDutycycle).nthCalledWith(index + 1, ex)
  })

  await expect(blink).resolves.not.toThrow()
})
