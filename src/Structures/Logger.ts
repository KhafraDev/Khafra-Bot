import { EOL, hostname } from 'os';
import SonicBoom from 'sonic-boom';
import { inspect } from 'util';
import {
    bright, cyan, red, yellow
} from '../lib/Utility/Colors.js';

type LoggerLevels = 'DEBUG' | 'INFO' | 'ERROR' | 'WARN';

const stdout = new SonicBoom({ fd: process.stdout.fd, sync: false });
const stderr = new SonicBoom({ fd: process.stderr.fd, sync: false });
const pid = process.pid;
const host = hostname();

const getLevel = (l: LoggerLevels) => {
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
    if (o && typeof o === 'object') {
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
            for (const key of Object.keys(o) as (keyof typeof o)[]) {
                const ref = o[key];
                if (ref && typeof ref === 'object') {
                    message += `${tab}${key}: ${inspect(ref, undefined, undefined, true)}${EOL}`;
                } else {
                    message += `${tab}${key}: ${ref}${EOL}`;
                }
            }
        }
    } else {
        message += `${tab}${typeof o}: ${o}${EOL}`;
    }
    
    return message;
}

/**
 * A logger that outputs very fast in similar fashion to pino-pretty!
 */
export class Logger {
    write (message: string, level: LoggerLevels) {
        if (level === 'ERROR' || level === 'WARN') {
            stderr.write(message);
        } else {
            stdout.write(message);
        }
    }

    log (message: unknown, data?: unknown, level: LoggerLevels = 'DEBUG') {
        const starter = '[' + Date.now() + '] ' + getLevel(level) + ' (' + pid + ') on ' + host + ': ';
        // const starter = `[${Date.now()}] ${getLevel(level)} (${pid} on ${host}): `;
        if (typeof message === 'string') {
            if (data && typeof data === 'object') {
                this.write(starter + message + EOL + objectToReadable(data), level);
            } else {
                this.write(starter + message + EOL, level);
            }
        } else {
            this.write(starter + EOL + objectToReadable(message), level);
        }
    }

    debug (a: unknown, b?: unknown) {
        this.log(a, b, 'DEBUG');
    }
    
    info (a: unknown, b?: unknown) {
        this.log(a, b, 'INFO');
    }

    error (a: unknown, b?: unknown) {
        this.log(a, b, 'ERROR');
    }

    warn (a: unknown, b?: unknown) {
        this.log(a, b, 'WARN');
    }
}