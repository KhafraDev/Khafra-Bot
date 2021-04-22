import { rm } from 'node:fs/promises';

await rm('./build/', {
    recursive: true
}).catch(() => {});