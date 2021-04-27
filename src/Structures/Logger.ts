import { join } from 'node:path';
import { mkdirSync, createWriteStream, WriteStream } from 'node:fs';
import { formatDate } from '../lib/Utility/Date.js';
import { inspect } from 'node:util';
import { EOL } from 'node:os';

const logPath = join(process.cwd(), 'assets/Logger');
mkdirSync(logPath, { recursive: true }); // make all missing directories

export class Logger {
    name: string;
    stream: WriteStream;

    constructor(name: string) {
        this.name = name;
        this.stream = createWriteStream(join(logPath, this.name + '.log'), { 
            flags: 'a',
            encoding: 'utf-8' 
        });

        // this.stream.write(`[${formatDate('MM-DD-YYYY hh:mm:ssA', new Date())}] Initialized ${this.name}.\n`);
    }

    log(data: unknown) {
        const formatted = `[${formatDate('MM-DD-YYYY hh:mm:ssA', new Date())}] ${this.name}: "${typeof data === 'string' ? data : inspect(data)}"`;
        this.stream.write(`${formatted}${EOL}`);
    }
}

