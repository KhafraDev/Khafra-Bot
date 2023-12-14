import { createDeferredPromise } from '#khaf/utility/util.mjs'
import assert from 'node:assert'

function isThenable (value: unknown): value is Pick<Promise<unknown>, 'then' | 'catch'> {
  return (
    !!value
    && typeof (value as { then?: unknown }).then === 'function'
    && typeof (value as { catch?: unknown }).catch === 'function'
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function once<T extends (...args: any[]) => any> (fn: T, expires?: number): T {
  assert(typeof fn === 'function')

  let res: ReturnType<T> | Promise<ReturnType<T>> // sync return value
  let ran = false // set once sync fn runs
  let isRunning = false // if async fn is running
  let deferred: ReturnType<typeof createDeferredPromise>

  function expire (): void {
    res = undefined!
    ran = false
    isRunning = false
    deferred = undefined!
  }

  return ((...args: Parameters<T>) => {
    if (ran) return res // eslint-disable-line @typescript-eslint/no-unsafe-return
    if (isRunning) return deferred.promise

    res = fn(...args) as ReturnType<T> | Promise<ReturnType<T>>

    if (isThenable(res)) {
      deferred = createDeferredPromise()
      isRunning = true

      res
        .then((v: unknown) => {
          if (typeof expires === 'number') {
            setTimeout(expire, expires)
          }

          return deferred.resolve(v)
        })
        .catch((err: Error) => deferred.reject(err))

      return deferred.promise
    }

    if (typeof expires === 'number') {
      setTimeout(expire, expires)
    }

    ran = true
    return res // eslint-disable-line @typescript-eslint/no-unsafe-return
  }) as T
}
