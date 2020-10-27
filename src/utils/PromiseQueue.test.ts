
import { PromiseQueue } from './PromiseQueue'

test('execution for normaly', async () => {
    const queue = new PromiseQueue()
    const a = await queue.add(async () => {
        return new Promise((resolve) => { resolve(2 + 2) })
    })
    expect(a).toBe(4)
})

test('pending count', () => {
    const queue = new PromiseQueue()
    queue.add(
        async () => new Promise(() => { return 0 })
    ).finally(() => { throw new Error('failed') })

    queue.add(
        async () => new Promise(() => { return 0 })
    ).finally(() => { throw new Error('failed') })

    expect(queue.getPendingLength()).toBe(1)
    expect(queue.getQueueLength()).toBe(1)

    queue.add(
        async () => new Promise(() => { return 0 })
    ).finally(() => { throw new Error('failed') })
    expect(queue.getQueueLength()).toBe(2)
})

test('reject ', async () => {
    const queue = new PromiseQueue()

    const error = queue.add(
        async () => new Promise((resolve, reject) => { reject(new Error('test')) })
    )
    expect.assertions(1)
    await expect(error).rejects.toThrow('test')
})
