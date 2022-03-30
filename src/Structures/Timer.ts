import { setTimeout } from 'timers/promises';

interface Options {
    interval: number
}

type Generator = AsyncGenerator<number, never, unknown>;

export abstract class Timer {
    public constructor (public options: Options) {}

    public abstract setInterval (): Promise<unknown>;

    public abstract action (...items: unknown[]): Promise<void>;

    public yieldEvery (ms: number): { [Symbol.asyncIterator](): Generator } {
    	let i = 0;
    	return {
    		async * [Symbol.asyncIterator](): Generator {
    			while (true) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
    				yield i++;
    				await setTimeout(ms);
    			}
    		}
    	}
    }
}