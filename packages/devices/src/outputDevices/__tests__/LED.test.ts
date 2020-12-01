import { StubGpio, StubPigpio } from '../../__tests__/StubPigpio'
import { LED } from '../'

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
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  // initial value
  expect(mockedGpio.write).toBeCalledTimes(1)
  expect(mockedGpio.write).lastCalledWith(1)
  expect(mockedGpio.setMode).lastCalledWith('OUTPUT')
})
test('close', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  await led.close()
})
test('on', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  await led.on()
  expect(mockedGpio.write).lastCalledWith(1)
})
test('off', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  await led.off()
  expect(mockedGpio.write).lastCalledWith(0)
})
test('isLit', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  asMock(mockedGpio.read).mockReturnValueOnce(1)
  expect(await led.isLit()).toBe(true)

  asMock(mockedGpio.read).mockReturnValueOnce(0)
  expect(await led.isLit()).toBe(false)
})
test('toggle', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  asMock(mockedGpio.read).mockReturnValueOnce(1)
  await led.toggle()
  expect(mockedGpio.write).lastCalledWith(0)

  await led.toggle()
  expect(mockedGpio.write).lastCalledWith(1)
})

test('setValue', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  await led.setValue(1)
  expect(mockedGpio.write).lastCalledWith(1)
  await led.setValue(0)
  expect(mockedGpio.write).lastCalledWith(0)
})
test('setValue over 1', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  await expect(led.setValue(14)).rejects.toThrow()
})
test('getValue', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  asMock(mockedGpio.read).mockReturnValueOnce(1)
  expect(await led.getValue()).toBe(1)

  asMock(mockedGpio.read).mockReturnValueOnce(0)
  expect(await led.getValue()).toBe(0)
})
test('blink', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  expect(mockedGpio.write).lastCalledWith(1)
  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(1000)
  expect(mockedGpio.write).lastCalledWith(1)
  await waitAfter(2000)
  expect(mockedGpio.write).lastCalledWith(0)
  await waitAfter(1000)
  expect(mockedGpio.write).lastCalledWith(1)
  await waitAfter(2000)
  expect(mockedGpio.write).lastCalledWith(0)
  await expect(blink).resolves.not.toThrow()
})
test('blink cancel', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  expect(mockedGpio.write).lastCalledWith(1)
  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(1000)
  expect(mockedGpio.write).lastCalledWith(1)
  await waitAfter(2000)
  await led.blink({ repeat: 0 })
  await expect(blink).rejects.toThrow()
})
test('blink error', async () => {
  const led = await LED(5, true, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  expect(mockedGpio.write).lastCalledWith(1)
  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(1000)
  expect(mockedGpio.write).lastCalledWith(1)
  await waitAfter(2000)

  asMock(mockedGpio.write).mockImplementationOnce(() => {
    throw new Error('Test error')
  })
  await expect(blink).rejects.toThrow('Test error')
})
