import { Ssd1306 } from './ssd1306'

const range = (start: number, end: number) => Array.from(
    { length: end - start + 1 }, (v, k) => k + start
)

test('init', async () => {
    const close = jest.fn()
    const command = jest.fn()
    const data = jest.fn()
    const ssd1306 = new Ssd1306({ command, data, close })
    await ssd1306.init()
    expect(command).toHaveBeenCalled()
})

test('draw vertical 1 line', async () => {
    const close = jest.fn()
    const command = jest.fn()
    const data = jest.fn()
    const ssd1306 = new Ssd1306({ command, data, close }, 128, 64)
    const line = Buffer.of(0b000000001, ...range(0, 14).map(() => 0))
    const d = Buffer.concat(range(0, 63).map(() => line))
    await ssd1306.draw(d)

    const verticalline = Buffer.concat(
        range(0, 7).map(() => Buffer.of(0b11111111, ...range(0, 126).map(() => 0)))
    )
    const expectData = Buffer.concat([Buffer.of(0b01000000), verticalline])
    expect(data).toHaveBeenCalledWith(expectData)
})
test('draw horizontal 1 line', async () => {
    const close = jest.fn()
    const command = jest.fn()
    const data = jest.fn()
    const ssd1306 = new Ssd1306({ command, data, close }, 128, 64)
    const dline = Buffer.of(...range(0, 15).map(() => 0b11111111))
    const d = Buffer.concat([dline, Buffer.alloc(1024 - 16)])
    expect(d.length).toBe((128 * 64) / 8)
    await ssd1306.draw(d)

    const line = Buffer.of(...range(0, 127).map(() => 0b000000001), ...Buffer.alloc(1024 - 128))
    const expectData = Buffer.concat([Buffer.of(0b01000000), line])
    expect(data).toHaveBeenCalledWith(expectData)
})
