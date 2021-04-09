import { randomInt } from 'node:crypto';
import { promisify } from 'node:util';

// TODO(@KhafraDev): convert to timers/promises once API is stable
export const delay = promisify(setTimeout);
export const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);