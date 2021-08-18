import { randomInt } from 'crypto';
import { promisify } from 'util';
import { setTimeout } from 'timers/promises';

export const delay = (ms: number, value?: unknown) => setTimeout(ms, value, { ref: false });
/**
 * Generate a random number!
 *  
 * If no second value is provided, the range will be [0, a)
 * Otherwise, the range will be from [a, b)
 */
export const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);