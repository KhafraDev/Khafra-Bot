import { rmdir } from 'fs/promises';
import { join, resolve } from 'path';

rmdir(join(resolve('.'), 'build'), {
    recursive: true
}).then(() => {});