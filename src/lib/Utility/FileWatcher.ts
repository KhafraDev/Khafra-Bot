import { readFileSync, watch } from 'fs';
import { readFile } from 'fs/promises';
import { dirname, basename, join } from 'path';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

export const createFileWatcher = <F extends Record<string, unknown> | unknown[]>(storage: F, path: string) => {
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

    watch(path, async (event, filename) => {
        if (event !== 'change') return;
        if (base !== filename) return;

        const [err, file] = await dontThrow<F>(JSON.parse, [await readFile(join(dir, filename), 'utf-8')]);
        
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

    return storage;
}