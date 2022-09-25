import { readFileSync, watch, existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

type Watcher = Record<string, unknown> | unknown[]

const watchers = new Map<string, Watcher>()

export const createFileWatcher = <F extends Watcher>(path: string): F => {
    const watcher = watchers.get(path)

    if (watcher !== undefined) {
        return watcher as F
    }

    const dir = dirname(path)
    const base = basename(path)
    const descriptors: PropertyDescriptor = { enumerable: true, configurable: true, writable: true }

    const file = JSON.parse(readFileSync(path, 'utf-8')) as F
    const storage = (Array.isArray(file) ? [] : {}) as F

    if (Array.isArray(file) && Array.isArray(storage)) {
        storage.push(...file)
    } else {
        for (const [key, value] of Object.entries(file)) {
            Object.defineProperty(storage, key, {
                value,
                ...descriptors
            })
        }
    }

    watch(path, (event, filename) => {
        if (event !== 'change') return
        if (base !== filename) return
        if (!existsSync(join(dir, filename))) return

        let err: Error | null = null, file!: F

        try {
            file = JSON.parse(readFileSync(join(dir, filename), 'utf-8')) as F
        } catch (e) {
            err = e as Error
        }

        if (err === null) {
            if (Array.isArray(storage) && Array.isArray(file)) {
                storage.length = 0
                storage.push(...file)
            } else {
                for (const [key, value] of Object.entries(file)) {
                    Reflect.deleteProperty(storage, key)
                    Object.defineProperty(storage, key, {
                        value,
                        ...descriptors
                    })
                }
            }
        }
    })

    watchers.set(path, storage)
    return storage
}