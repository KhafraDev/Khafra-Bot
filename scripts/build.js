import { rmdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

await rmdir(join(resolve('.'), 'build'), {
    recursive: true
});