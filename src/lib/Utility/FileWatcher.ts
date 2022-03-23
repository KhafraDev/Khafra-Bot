import { readFileSync, watch } from 'fs';
import { readFile, stat } from 'fs/promises';
import { dirname, basename, join } from 'path';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';

type Watcher = Record<string, unknown> | unknown[];

const watchers = new Map<string, Watcher>();

const exists = async (file: string): Promise<boolean> => {
    const [err] = await dontThrow(stat(file), { logOnFail: false });
    return err === null;
}

export const createFileWatcher = <F extends Watcher>(storage: F, path: string): F => {
    if (watchers.has(path)) {
        return watchers.get(path)! as F;
    }

    const dir = dirname(path);
    const base = basename(path);
    const descriptors: PropertyDescriptor = { enumerable: true, configurable: true, writable: true };

    const file = JSON.parse(readFileSync(path, 'utf-8')) as F;

    if (Array.isArray(storage) && Array.isArray(file)) {
        storage.push(...file);
    } else {
        for (const [key, value] of Object.entries(file)) {
            Object.defineProperty(storage, key, {
                value,
                ...descriptors
            });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    watch(path, async (event, filename) => {
        if (event !== 'change') return;
        if (base !== filename) return;
        if (!await exists(join(dir, filename))) return;

        let err: Error | null = null, file!: F;

        try {
            file = JSON.parse(await readFile(join(dir, filename), 'utf-8')) as F;
        } catch (e) {
            err = e as Error;
        }

        if (err === null) {
            if (Array.isArray(storage) && Array.isArray(file)) {
                if (storage.length > file.length)
                    storage.splice(storage.length);

                for (let i = 0; i < file.length; i++) {
                    storage.splice(i, 1);
                    storage.push(file[i]);
                }
            } else {
                for (const [key, value] of Object.entries(file)) {
                    delete (storage as Record<string, unknown>)[key];
                    Object.defineProperty(storage, key, {
                        value,
                        ...descriptors
                    });
                }
            }
        }
    });

    watchers.set(path, storage);
    return storage;
}