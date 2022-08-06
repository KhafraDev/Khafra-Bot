interface DeferredPromise {
    resolve: () => void
    reject: () => void
    promise: Promise<void>
}

export class AsyncQueue extends Array<DeferredPromise> {
    /**
     * Creates a deferred promise.
     */
    public createDeferredPromise (): DeferredPromise {
        let resolve: DeferredPromise['resolve'] | undefined,
            reject: DeferredPromise['reject'] | undefined

        const promise = new Promise<void>((res, rej) => {
            resolve = res
            reject = rej
        })

        return {
            resolve: resolve!,
            reject: reject!,
            promise
        }
    }

    public wait (): Promise<void> {
        const next = this.length !== 0 ? this.at(-1)!.promise : Promise.resolve()

        this.push(this.createDeferredPromise())

        return next
    }

    public dequeue (): void {
        if (this.length === 0) return undefined

        const promise = this.shift()!
        void promise.resolve()

        return undefined
    }
}