import { pigpio, Pigpio } from '../index'

let instance: Pigpio | undefined

export const get = async (): Promise<Pigpio> => {
    if (!instance) {
        instance = await pigpio(undefined, undefined, true)
    }
    return instance
}

export const shutdown = async (): Promise<void> => {
    const toshutdown = instance
    instance = undefined
    await toshutdown?.close()
}

process.on('beforeExit', () => shutdown)

export default { get, shutdown }
