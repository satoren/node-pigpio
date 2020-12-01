import { StubGpio, StubPigpio } from '../../__tests__/StubPigpio'
import { inputDevices } from '../../'

const Button = inputDevices.Button

jest.mock('../../__tests__/StubPigpio')

const mockedPigpio = new StubPigpio()
mockedPigpio.gpio = jest.fn((pin) => new StubGpio(pin))

const StubGpioMock = StubGpio as jest.MockedClass<typeof StubGpio>

beforeEach(() => {
  jest.clearAllMocks()
})
test('open', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  // initial value
  expect(mockedGpio.setMode).lastCalledWith('INPUT')
})
test('close', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]
  await button.close()
  expect(mockedGpio.close).toBeCalled()
})

test('on', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]

  await button.on('pressed', () => {})

  expect(mockedGpio.on).lastCalledWith('fallingEdge', expect.anything())
  await button.on('released', () => {})

  expect(mockedGpio.on).lastCalledWith('risingEdge', expect.anything())
})

test('addListener', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]

  await button.addListener('pressed', () => {})

  expect(mockedGpio.addListener).lastCalledWith(
    'fallingEdge',
    expect.anything()
  )
  await button.addListener('released', () => {})

  expect(mockedGpio.addListener).lastCalledWith('risingEdge', expect.anything())
})
test('once', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]

  await button.once('pressed', () => {})

  expect(mockedGpio.once).lastCalledWith('fallingEdge', expect.anything())
  await button.once('released', () => {})

  expect(mockedGpio.once).lastCalledWith('risingEdge', expect.anything())
})
test('removeListener', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]

  await button.removeListener('pressed', () => {})

  expect(mockedGpio.removeListener).lastCalledWith(
    'fallingEdge',
    expect.anything()
  )
  await button.removeListener('released', () => {})

  expect(mockedGpio.removeListener).lastCalledWith(
    'risingEdge',
    expect.anything()
  )
})
test('removeListener', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]

  await button.off('pressed', () => {})

  expect(mockedGpio.off).lastCalledWith('fallingEdge', expect.anything())
  await button.off('released', () => {})

  expect(mockedGpio.off).lastCalledWith('risingEdge', expect.anything())
})

test('waitForPress', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]

  await button.waitForPress()

  expect(mockedGpio.waitForEdge).lastCalledWith('fallingEdge', undefined)
})
test('waitForRelease', async () => {
  const button = await Button(5, true, mockedPigpio)
  const mockedGpio = StubGpioMock.mock.instances[0]

  await button.waitForRelease()

  expect(mockedGpio.waitForEdge).lastCalledWith('risingEdge', undefined)
})
