import { join } from 'path';
import { cwd as processCwd } from 'process';

export const cwd = processCwd();
export const assets = join(cwd, 'assets');