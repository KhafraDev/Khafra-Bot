import { types } from 'node:util';

type SyncFn = (...args: unknown[]) => unknown;
type AsyncFn = (...args: unknown[]) => Promise<unknown>;

/**
 * Memoize a function.
 */
export function once<T extends SyncFn>(fn: T): () => ReturnType<T>;
export function once<T extends AsyncFn>(fn: T): () => ReturnType<T>;
export function once(fn: SyncFn | AsyncFn) {
    if (typeof fn !== 'function')
        throw new TypeError(`fn must be a function, received ${typeof fn}`);

    let res: ReturnType<typeof fn> = undefined, 
        ran = false,
        // if the function is running (async), return null
        // because it's being memoized.
        isRunning = false;

    if (!types.isAsyncFunction(fn)) {
        return () => {
            if (ran) return res;
            res = fn();
            ran = true;
            return res;
        }
    }

    return async () => {
        if (ran) return res;
        if (isRunning) return null;

        isRunning = true;
        res = await fn();
        ran = true;
        isRunning = false;

        return res;
    }
}