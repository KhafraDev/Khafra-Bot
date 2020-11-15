import { rmdir } from 'fs/promises';
import { join, resolve } from 'path';

await rmdir(join(resolve('.'), 'build'), {
    recursive: true
});