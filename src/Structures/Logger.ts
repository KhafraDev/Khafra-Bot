import {
    bright, cyan, green, magenta, red, yellow
} from '#khaf/utility/Colors.js';
import { EOL, hostname } from 'os';
import { pid, stderr, stdout } from 'process';
import SonicBoom from 'sonic-boom';

type LoggerLevels = 'DEBUG' | 'INFO' | 'ERROR' | 'WARN';

const stdoutStream = new SonicBoom({ fd: stdout.fd, sync: false });
const stderrStream = new SonicBoom({ fd: stderr.fd, sync: false });
const errorStackIndent = / {4}/g;
const processId = pid;
const host = hostname();
const blankParam = Symbol('khafra.logging');

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
const errorToReadable = (err: Error & { cause?: unknown }, indentation = 1, newLineFirst = false) => {
    let error = '';
    const indent = ' '.repeat(indentation * 2);
    const moreIndent = ' '.repeat((indentation + 1) * 2);

	if (err.stack) {
        if (newLineFirst) error += EOL;
		error += indent + err.stack.replace(errorStackIndent, moreIndent);
	} else {
        error += indent + err.message.replace(errorStackIndent, moreIndent) + EOL;
    }

	if ('cause' in err) {
        if (err.cause instanceof Error) {
            error += errorToReadable(err.cause, indentation + 1, true);
        } else {
            error += moreIndent + ' cause: ' + objectToReadable(err.cause, indentation + 1);
        }
	}

	return error;
}

const objectToReadable = (o: unknown, depth = 1) => {
    switch (typeof o) {
        case 'symbol': return ' ' + green(o.toString()) + EOL;
        case 'undefined': return EOL;
        case 'object': {
            const tab = '  '.repeat(depth);

            if (o === null) {
                return `[NULL]: ${o}${EOL}`
            } else if (o instanceof Error) {
                return errorToReadable(o, depth) + EOL;
            }

            let message = '';

            for (const key in o) {
                const ref = o[key as keyof typeof o] as unknown;
                message += tab + key + ': ';

                const type = typeof ref;
                if (ref && type === 'object') {
                    if (isDate(ref as object)) {
                        // toISOString is *slow* - https://twitter.com/dirkdev98/status/1449306210210037762
                        message += magenta(ref) + EOL;
                    } else {
                        message += EOL;
                        message += objectToReadable(ref, depth + 1);
                    }
                } else if (type === 'symbol') {
                    message += green((ref as symbol).toString()) + EOL;
                } else {
                    message += ref + EOL;
                }
            }

            return message.trimEnd() + EOL;
        }
        default: return ` ${o}` + EOL;
    }
}

/**
 * A logger that outputs very fast in similar fashion to pino-pretty!
 */
class Logger {
    close (): void {
        stderrStream.end();
        stdoutStream.end();
    }

    write (message: string, level: LoggerLevels) {
        if (level === 'ERROR' || level === 'WARN') {
            stderrStream.write(message);
        } else {
            stdoutStream.write(message);
        }
    }

    log (message: unknown, data: unknown = blankParam, level: LoggerLevels = 'DEBUG') {
        const starter = '[' + Date.now() + '] ' + getLevel(level) + ' (' + processId + ') on ' + host + ': ';

        if (typeof message === 'string') {
            if (data === blankParam) {
                this.write(starter + message + EOL, level);
            } else {
                this.write(starter + message + EOL + objectToReadable(data), level);
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

export const logger = new Logger();