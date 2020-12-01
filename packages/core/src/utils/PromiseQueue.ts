export class PromiseQueue {
  private pendingPromises = 0
  private maxPendingPromises = 1

  private queue: (() => void)[] = []

  constructor(maxPendingPromises = 1) {
    this.maxPendingPromises = maxPendingPromises
  }

  add<T>(p: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const pending = () => {
        p()
          .then((v) => {
            resolve(v)
            this.pendingPromises -= 1
            this.dequeue()
          })
          .catch((err) => {
            reject(err)
            this.pendingPromises -= 1
            this.dequeue()
          })
      }
      this.queue.push(pending)
      this.dequeue()
    })
  }

  dequeue(): void {
    if (this.pendingPromises >= this.maxPendingPromises) {
      return
    }
    const item = this.queue.shift()
    if (!item) {
      return
    }
    this.pendingPromises += 1
    item()
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getPendingLength(): number {
    return this.pendingPromises
  }
}

export default { PromiseQueue }
