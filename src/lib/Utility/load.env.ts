import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { cwd, env } from 'process';

const propertyDescriptors: PropertyDescriptor = {
    writable: true,
    configurable: true,
    enumerable: true
}

const path = join(cwd(), '.env');
if (!existsSync(path)) {
    throw new Error('.env: No .env file found at the root of the repo!');
}

const file = readFileSync(path, 'utf-8').split(/\r?\n/g);
for (const line of file) {
    if (line.startsWith('#')) continue;

    const [k, ...v] = line.split('=');
    const value = v.join('=');

    Object.defineProperty(env, k, {
        value: value.startsWith('"') && value.endsWith('"')
            ? value.slice(1, -1)
            : value,
        ...propertyDescriptors
    });
}