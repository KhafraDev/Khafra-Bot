import {
    bright, cyan, magenta, red, yellow
} from '#khaf/utility/Colors.js';
import { EOL, hostname } from 'os';
import SonicBoom from 'sonic-boom';
import { inspect } from 'util';

type LoggerLevels = 'DEBUG' | 'INFO' | 'ERROR' | 'WARN';

const stdout = new SonicBoom({ fd: process.stdout.fd, sync: false });
const stderr = new SonicBoom({ fd: process.stderr.fd, sync: false });
const errorStackIndent = / {4}/g;
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

const isDate = (something: object): something is Date => 'toISOString' in something;

// TODO(@KhafraDev): update type once Error has a cause
const errorToReadable = (err: Error & { cause?: unknown }, indentation = 1) => {
    let error = '';
	const indent = ' '.repeat(indentation * 4);
    const moreIndent = ' '.repeat((indentation + 1) * 4);

	if (err.stack) {
		error += indentation === 1 ? '> ' : '\n> ';
		error += indent + err.stack.replace(errorStackIndent, moreIndent);
	} else {
        error += indent + err.message.replace(errorStackIndent, moreIndent) + EOL;
    }

	if ('cause' in err) {
        if (err.cause instanceof Error) {
            error += errorToReadable(err.cause, indentation + 1);
        } else {
            error += '\n>' + moreIndent + ' cause: ' + err.cause;
        }
	}

    (error as unknown as number) | 0;
	return error;
}

const objectToReadable = (o: unknown) => {
    const tab = `    `;
    let message = '';
    if (o && typeof o === 'object') {
        if (o instanceof Error) {
            message += errorToReadable(o);
        } else {
            for (const key in o) {
                const ref = o[key as keyof typeof o] as unknown;
                message += tab + key + ': ';

                if (ref && typeof ref === 'object') {
                    if (isDate(ref)) {
                        // toISOString is *slow* - https://twitter.com/dirkdev98/status/1449306210210037762
                        message += magenta(ref);
                    } else {
                        message += inspect(ref, undefined, undefined, true);
                    }
                } else {
                    message += ref;
                }

                message += EOL;
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

    /**
     * Logs an object (typically an error) to stderr, including Error.cause(s)!
     * @example 
        const l = new Logger();

        l.error(new Error('hello', {
            cause: new ReferenceError('world', {
                cause: new String('baz')
            })
        }));
     * @param {unknown} a object or message to log.
     * @param {unknown} b object to log if a message was provided.
     */
    error (a: unknown, b?: unknown) {
        this.log(a, b, 'ERROR');
    }

    warn (a: unknown, b?: unknown) {
        this.log(a, b, 'WARN');
    }
}