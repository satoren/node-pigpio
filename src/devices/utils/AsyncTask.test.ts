
import { AsyncTaskScheduler, CancelableTask, Sleepable } from './AsyncTask'

beforeEach(() => {
    jest.clearAllMocks()
})
test('stop task', async () => {
    const task = new AsyncTaskScheduler()

    const cancel = jest.fn()
    const t: CancelableTask = Sleepable((sleep) => () => ({
        promise: sleep(1000),
        cancel
    }))

    const started = task.start(t)
    expect(task.running()).toBe(true)
    task.stop()

    expect(cancel).toBeCalled()
    expect(task.running()).toBe(false)
    await expect(started).rejects.toThrow()
})
