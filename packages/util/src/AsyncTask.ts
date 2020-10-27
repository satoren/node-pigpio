type CancelTrigger = ()=>void
export type CancelableTask<T = void> = ()=> {
    promise: Promise<T>;
    cancel:CancelTrigger;
}

export class CanceledError extends Error {
    constructor (message: string) {
        super(message)
        this.name = 'CanceledError'
    }
}

export class AsyncTaskScheduler {
    private cancel?: CancelTrigger
    async start<T> (task: CancelableTask<T>): Promise<T> {
        this.cancel?.()
        const p = task()
        this.cancel = p.cancel
        return p.promise.finally(() => {
            this.cancel = undefined
        })
    }

    stop (): void {
        this.cancel?.()
        this.cancel = undefined
    }

    running (): boolean {
        return this.cancel != null
    }
}

type SleepFunction = (msec: number)=> Promise<void>
export const Sleepable = (baseTask: (sleep: SleepFunction) => CancelableTask): CancelableTask => () => {
    let cancel: (()=> void) | undefined
    const sleep = async (msec: number) => {
        const promise = new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(resolve, msec)
            cancel = () => {
                reject(new CanceledError('canceled'))
                clearTimeout(timeoutId)
            }
        })
        await promise
    }
    const p = baseTask(sleep)()
    return {
        promise: p.promise,
        cancel: () => {
            p.cancel()
            cancel?.()
        }
    }
}
