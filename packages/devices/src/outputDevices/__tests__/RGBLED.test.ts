import { buildSequence } from '../RGBLED'

test('buildSequence', () => {
    const sequence = buildSequence({ onTime: 4, offTime: 5, onColor: { r: 1, g: 0, b: 0 }, offColor: { r: 0, g: 1, b: 0 }, fadeInTime: 2, fadeOutTime: 3, repeat: 2, fps: 1000 })

    expect(sequence).toStrictEqual([
        {
            delay: 1,
            value: {
                b: 0,
                g: 1,
                r: 0
            }
        },
        {
            delay: 1,
            value: {
                b: 0,
                g: 0.5,
                r: 0.5
            }
        },
        {
            delay: 4,
            value: {
                b: 0,
                g: 0,
                r: 1
            }
        },
        {
            delay: 1,
            value: {
                b: 0,
                g: 0,
                r: 1
            }
        },
        {
            delay: 1,
            value: {
                b: 0,
                g: 0.3333333333333333,
                r: 0.6666666666666667
            }
        },
        {
            delay: 1,
            value: {
                b: 0,
                g: 0.6666666666666666,
                r: 0.33333333333333337
            }
        },
        {
            delay: 5,
            value: {
                b: 0,
                g: 1,
                r: 0
            }
        }])
})
