import { assets } from '#khaf/utility/Constants/Path.js';
import { rmSync } from 'node:fs';
import pino from 'pino';

class Logger {
    #pino: ReturnType<typeof pino>;
    #destination: ReturnType<typeof pino['destination']>;
    #path: string;

    constructor () {
        this.#path = assets(`log-${Date.now()}.txt`);
        this.#destination = pino.destination({ dest: this.#path, sync: false });
        this.#pino = pino(this.#destination);
    }

    public get path (): string {
        return this.#path;
    }

    public rotate (): void {
        this.#path = assets(`log-${Date.now()}.txt`);
        this.#destination = pino.destination({ dest: this.#path, sync: false });
        this.#pino = pino(this.#destination);
    }

    public stop (): void {
        this.#destination.end();
        this.#pino = null!;
        this.#destination = null!;
        rmSync(this.#path);
    }

    warn <T, U>(...args: [T, ...U[]]): void {
        this.#pino.warn(...args as [unknown]);
    }

    error <T, U>(...args: [T, ...U[]]): void {
        this.#pino.error(...args as [unknown]);
    }

    info <T, U>(...args: [T, ...U[]]): void {
        this.#pino.info(...args as [unknown]);
    }

    debug <T, U>(...args: [T, ...U[]]): void {
        this.#pino.debug(...args as [unknown]);
    }

    fatal <T, U>(...args: [T, ...U[]]): void {
        this.#pino.fatal(...args as [unknown]);
    }

    silent <T, U>(...args: [T, ...U[]]): void {
        this.#pino.silent(...args as [unknown]);
    }

    trace <T, U>(...args: [T, ...U[]]): void {
        this.#pino.trace(...args as [unknown]);
    }
}

export const logger = new Logger();
