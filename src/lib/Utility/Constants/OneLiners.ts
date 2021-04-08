import { randomInt } from 'node:crypto';
import { promisify } from 'node:util';

export const delay = promisify(setTimeout);
export const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);