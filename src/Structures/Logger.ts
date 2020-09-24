import { join } from 'path';
import { mkdirSync, createWriteStream, WriteStream } from 'fs';
import { formatDate } from '../lib/Utility/Date';
import { inspect } from 'util';

const logPath = join(process.cwd(), 'build/lib/Logger');
mkdirSync(logPath, { recursive: true }); // make all missing directories

export class Logger {
    name: string;
    stream: WriteStream;

    constructor(name: string) {
        this.name = name;
        this.stream = createWriteStream(join(logPath, this.name + '.log'), { flags: 'a' });

        this.stream.write(`[${formatDate('MM-DD-YYYY hh:mm:ssA', new Date())}] Initialized ${this.name}.\n`);
    }

    log(data: any) {
        const formatted = `[${formatDate('MM-DD-YYYY hh:mm:ssA', new Date())}] ${this.name}: "${typeof data === 'string' ? data : inspect(data)}"`;
        this.stream.write(formatted + '\n');
    }
}

