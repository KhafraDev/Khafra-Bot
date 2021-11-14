import { write as FSWrite } from 'fs';
import { EOL, hostname } from 'os';
import { inspect, types } from 'util';
import {
    bright, cyan, red, yellow
} from '../lib/Utility/Colors.js';

export enum LoggerLevels {
    DEBUG = 'debug',
    INFO = 'info',
    ERROR = 'error',
    WARN = 'warn'
};

const getLevel = (l: keyof typeof LoggerLevels) => {
    switch (l) {
        case 'DEBUG': return bright(cyan(l));
        case 'INFO': return yellow(l);
        case 'ERROR': return red(l);
        case 'WARN': return bright(red(l));
    }
}

const objectToReadable = (o: unknown) => {
    const tab = `    `;
    let message = '';

    if (types.isNativeError(o)) {
        if (o.stack) {
            const stack = o.stack
                .split(/\r\n|\n/g)
                .map(n => tab + n)
                .join(EOL);

            message += `${stack}${EOL}`;
        } else {
            message += `${tab}${o.name}: ${o.message}${EOL}`;
        }
    } else {
        if (o && typeof o === 'object') {
            for (const key of Reflect.ownKeys(o) as (keyof typeof o)[]) {
                const ref = o[key];
                if (ref && typeof ref === 'object') {
                    message += `${tab}${key}: ${inspect(ref, undefined, undefined, true)}${EOL}`;
                } else {
                    message += `${tab}${key}: ${ref}${EOL}`;    
                }
            }
        } else {
            message += `${tab}${typeof o}: ${o}${EOL}`;
        }
    }

    return message;
}

const pid = process.pid;
const host = hostname();

/**
 * A logger that outputs very fast in similar fashion to pino-pretty!
 */
export class Logger {
    constructor (
        public level: keyof typeof LoggerLevels = 'INFO'
    ) {
        this.level = level;
    }

    private write (message: string) {
        const fd = this.level === 'ERROR' || this.level === 'WARN'
            ? process.stderr.fd
            : process.stdout.fd;

        // benchmarking showed that async fs.write is 9-11x faster than
        // its sync counterpart, console.log, and process.stdout.write.
        FSWrite(fd, Buffer.from(message), () => {});
    }

    public log (message: unknown, level?: keyof typeof LoggerLevels | unknown): void;
    public log (message: string | unknown, data?: keyof typeof LoggerLevels | unknown, level?: keyof typeof LoggerLevels): void {
        const starter = `[${Date.now()}] ${getLevel(level ?? this.level)} (${pid} on ${host}): ${EOL}`;
        
        if (typeof message === 'string') {
            if (data && typeof data === 'object') {
                message = message.endsWith(EOL) ? message : message + EOL;

                return this.write(starter + objectToReadable(data));
            } else {
                return this.write(starter + message + EOL);
            }
        } else {
            return this.write(starter + '\n' + objectToReadable(message));
        }
    }
}