import { randomInt } from 'crypto';
import { promisify } from 'util';

export const delay = promisify(setTimeout);
export const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);