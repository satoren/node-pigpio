import { StubPWMLED } from './StubPWMLED'
import { PWMLED } from '../PWMLED'
import { RGBLED } from '../'

jest.mock('./StubPWMLED')
jest.mock('../PWMLED', () => ({
  PWMLED: jest.fn((n: any) => {
    return new StubPWMLED(n)
  }),
}))

const PWMLEDMock = PWMLED as jest.MockedFunction<typeof PWMLED>
const StubPWMLEDMock = StubPWMLED as jest.MockedClass<typeof StubPWMLED>

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
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  // RGB components
  expect(StubPWMLEDMock.mock.instances.length).toBe(3)

  // initial value
  expect(PWMLEDMock).nthCalledWith(1, 5, true, 0.1, undefined, undefined)
  expect(PWMLEDMock).nthCalledWith(2, 6, true, 0.2, undefined, undefined)
  expect(PWMLEDMock).nthCalledWith(3, 7, true, 0.3, undefined, undefined)
})
test('close', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  await led.close()
})
test('on', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const r = StubPWMLEDMock.mock.instances[0]
  const g = StubPWMLEDMock.mock.instances[1]
  const b = StubPWMLEDMock.mock.instances[2]
  await led.on()
  expect(r.on).toBeCalled()
  expect(g.on).toBeCalled()
  expect(b.on).toBeCalled()
})
test('off', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const r = StubPWMLEDMock.mock.instances[0]
  const g = StubPWMLEDMock.mock.instances[1]
  const b = StubPWMLEDMock.mock.instances[2]
  await led.off()
  expect(r.off).toBeCalled()
  expect(g.off).toBeCalled()
  expect(b.off).toBeCalled()
})
test('isLit', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const r = StubPWMLEDMock.mock.instances[0]
  const g = StubPWMLEDMock.mock.instances[1]
  const b = StubPWMLEDMock.mock.instances[2]
  asMock(r.isLit).mockReturnValueOnce(true)
  asMock(g.isLit).mockReturnValueOnce(true)
  asMock(b.isLit).mockReturnValueOnce(true)
  expect(await led.isLit()).toBe(true)

  asMock(r.isLit).mockReturnValueOnce(true)
  asMock(g.isLit).mockReturnValueOnce(false)
  asMock(b.isLit).mockReturnValueOnce(false)
  expect(await led.isLit()).toBe(true)

  asMock(r.isLit).mockReturnValueOnce(false)
  asMock(g.isLit).mockReturnValueOnce(false)
  asMock(b.isLit).mockReturnValueOnce(true)
  expect(await led.isLit()).toBe(true)

  asMock(r.isLit).mockReturnValueOnce(false)
  asMock(g.isLit).mockReturnValueOnce(false)
  asMock(b.isLit).mockReturnValueOnce(false)
  expect(await led.isLit()).toBe(false)
})
test('toggle', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const r = StubPWMLEDMock.mock.instances[0]
  const g = StubPWMLEDMock.mock.instances[1]
  const b = StubPWMLEDMock.mock.instances[2]
  await led.toggle()
  expect(r.toggle).toBeCalled()
  expect(g.toggle).toBeCalled()
  expect(b.toggle).toBeCalled()
})

test('setValue', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const r = StubPWMLEDMock.mock.instances[0]
  const g = StubPWMLEDMock.mock.instances[1]
  const b = StubPWMLEDMock.mock.instances[2]

  await led.setValue({ r: 0.2, g: 0.4, b: 0.8 })

  expect(r.setValue).toBeCalledWith(0.2)
  expect(g.setValue).toBeCalledWith(0.4)
  expect(b.setValue).toBeCalledWith(0.8)
})
test('getValue', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const r = StubPWMLEDMock.mock.instances[0]
  const g = StubPWMLEDMock.mock.instances[1]
  const b = StubPWMLEDMock.mock.instances[2]

  asMock(r.getValue).mockReturnValueOnce(0.9)
  asMock(g.getValue).mockReturnValueOnce(0.3)
  asMock(b.getValue).mockReturnValueOnce(0.2)
  expect(await led.getValue()).toEqual({ b: 0.2, g: 0.3, r: 0.9 })
})
test('blink', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const r = StubPWMLEDMock.mock.instances[0]
  const g = StubPWMLEDMock.mock.instances[1]
  const b = StubPWMLEDMock.mock.instances[2]

  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(1000)
  expect(r.setValue).lastCalledWith(1)
  expect(g.setValue).lastCalledWith(1)
  expect(b.setValue).lastCalledWith(1)
  await waitAfter(2000)
  expect(r.setValue).lastCalledWith(0)
  expect(g.setValue).lastCalledWith(0)
  expect(b.setValue).lastCalledWith(0)
  await waitAfter(1000)
  expect(r.setValue).lastCalledWith(1)
  expect(g.setValue).lastCalledWith(1)
  expect(b.setValue).lastCalledWith(1)
  await waitAfter(2000)
  expect(r.setValue).lastCalledWith(0)
  expect(g.setValue).lastCalledWith(0)
  expect(b.setValue).lastCalledWith(0)
  await expect(blink).resolves.not.toThrow()
})

test('blink cancel', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(2000)
  await led.blink({ repeat: 0 })
  await expect(blink).rejects.toThrow()
})
test('blink error', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 0.1, g: 0.2, b: 0.3 }, true)
  const b = StubPWMLEDMock.mock.instances[2]
  const blink = led.blink({ onTime: 1000, offTime: 2000, repeat: 2 })
  await waitAfter(1000)
  await waitAfter(2000)
  asMock(b.setValue).mockImplementationOnce(() => {
    throw new Error('Test error')
  })
  await expect(blink).rejects.toThrow('Test error')
})

test('pulse', async () => {
  const led = await RGBLED(5, 6, 7, true, { r: 1, g: 1, b: 1 }, true)
  const r = StubPWMLEDMock.mock.instances[0]
  const g = StubPWMLEDMock.mock.instances[1]
  const b = StubPWMLEDMock.mock.instances[2]
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
    0.1,
    0.2,
    0.3,
    0.4,
    0.5,
    0.6,
    0.7,
    0.8,
    0.9,
    1,
    0.8,
    0.6,
    0.4,
    0.19999999999999996,
    0,
  ]
  expects.forEach((ex, index) => {
    expect.any
    expect(r.setValue).nthCalledWith(index + 1, ex)
    expect(g.setValue).nthCalledWith(index + 1, ex)
    expect(b.setValue).nthCalledWith(index + 1, ex)
  })

  await expect(blink).resolves.not.toThrow()
})
