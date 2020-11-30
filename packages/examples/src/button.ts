import { inputDevices, usingAsync } from '@node-pigpio/devices'

import Button = inputDevices.Button

const sleep = (msec: number) => {
    return new Promise((resolve) => setTimeout(resolve, msec))
}
(async () => {
    await usingAsync(await Button(17), async (button) => {
        button.on('pressed', () => console.log('on pressed'))
        button.on('released', () => console.log('on released'))
        await button.waitForPress()
        console.log('Pressed')
        await button.waitForRelease()
        console.log('Released')

        await sleep(5000)
    })
})()
