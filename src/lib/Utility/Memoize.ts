import { createDeferredPromise } from '#khaf/utility/util.js'

type SyncFn = (...args: unknown[]) => unknown
type AsyncFn = (...args: unknown[]) => Promise<unknown>

/**
 * Memoize a function.
 */
export function once<T extends SyncFn>(fn: T, expires?: number): typeof fn
export function once<T extends AsyncFn>(fn: T, expires?: number): typeof fn
export function once(fn: SyncFn | AsyncFn, expires?: number): typeof fn {
  if (typeof fn !== 'function')
    throw new TypeError(`fn must be a function, received ${Object.prototype.toString.call(fn)}`)

  let res: ReturnType<typeof fn> // sync return value
  let ran = false // set once sync fn runs
  let isRunning = false // if async fn is running
  let deferred: ReturnType<typeof createDeferredPromise>

  function expire (): void {
    res = undefined
    ran = false
    isRunning = false
    deferred = undefined!
  }

  return () => {
    if (ran) return res
    if (isRunning) return deferred.promise

    res = fn()

    if (typeof (res as { then: unknown } | undefined)?.then === 'function' && res instanceof Promise) {
      deferred = createDeferredPromise()
      isRunning = true

      res
        .then((v) => {
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
    return res
  }
}
