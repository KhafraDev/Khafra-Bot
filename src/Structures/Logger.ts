import { write as FSWrite } from 'fs';
import { EOL, hostname } from 'os';
import { inspect } from 'util';
import {
    bright, cyan, red, yellow
} from '../lib/Utility/Colors.js';

type LoggerArguments = [message: string | unknown, data?: unknown];
type LoggerLevel = keyof typeof LoggerLevels;

export enum LoggerLevels {
    DEBUG = 'debug',
    INFO = 'info',
    ERROR = 'error',
    WARN = 'warn'
}

const getLevel = (l: LoggerLevel) => {
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

    if (o instanceof Error) {
        if (o.stack) {
            const stack = o.stack
                .split(/\r?\n/g)
                .map(n => tab + n)
                .join(EOL);

            message += `${stack}${EOL}`;
        } else {
            message += `${tab}${o.name}: ${o.message}${EOL}`;
        }
    } else {
        if (o && typeof o === 'object') {
            for (const key of Object.keys(o) as (keyof typeof o)[]) {
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
    private write (message: string, level: LoggerLevel) {
        const fd = level === 'ERROR' || level === 'WARN'
            ? process.stderr.fd
            : process.stdout.fd;

        // benchmarking showed that async fs.write is 9-11x faster than
        // its sync counterpart, console.log, and process.stdout.write.
        FSWrite(fd, Buffer.from(message), () => {});
    }

    public log (message: string | unknown, data?: unknown, level: LoggerLevel = 'DEBUG'): void {
        const starter = `[${Date.now()}] ${getLevel(level)} (${pid} on ${host}): `;
        
        if (typeof message === 'string') {
            if (data && typeof data === 'object') {
                message += EOL;
                return this.write(starter + message + objectToReadable(data), level);
            } else {
                return this.write(starter + message + EOL, level);
            }
        } else {
            return this.write(starter + '\n' + objectToReadable(message), level);
        }
    }

    public debug (...args: LoggerArguments) {
        this.log(args[0], args[1], 'DEBUG');
    }

    public info (...args: LoggerArguments) {
        this.log(args[0], args[1], 'INFO');
    }

    public error (...args: LoggerArguments) {
        this.log(args[0], args[1], 'ERROR');
    }

    public warn (...args: LoggerArguments) {
        this.log(args[0], args[1], 'WARN');
    }
}