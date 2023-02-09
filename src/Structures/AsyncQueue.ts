import { createDeferredPromise } from '#khaf/utility/util.js'

export class AsyncQueue extends Array<ReturnType<typeof createDeferredPromise>> {
  public wait (): Promise<unknown> {
    const next = this.length !== 0 ? this.at(-1)!.promise : Promise.resolve()

    this.push(createDeferredPromise())

    return next
  }

  public dequeue (): void {
    if (this.length === 0) return undefined

    const promise = this.shift()
    promise?.resolve(undefined)

    return undefined
  }
}
