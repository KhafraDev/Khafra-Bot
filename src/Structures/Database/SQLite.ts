import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { EventEmitter } from 'events';
import { Statement } from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { join, resolve } from 'path';
import { readdir, readFile } from 'fs/promises';

type Message = { 
    sql: string
    parameters: Parameters<Statement['run']> 
    opts?: {
        run: boolean
    }
};
type Queue = { event: EventEmitter, message: Message };

const queue: Queue[] = [];
const workers = new Map<number, { takeWork: () => void }>();

export const asyncQuery = <T extends unknown>(sql: string, opts?: Message['opts'], ...parameters: Message['parameters']) => {
    return new Promise<T[]>((resolve, reject) => {
        const event = new EventEmitter();
        event.on('result', resolve);
        event.on('error', reject);

        queue.push({
            event,
            message: { sql, opts, parameters },
        });

        for (const [, worker] of workers)
            worker.takeWork();
    });
}

const spawn = () => {
    const url = resolve(fileURLToPath(import.meta.url), '../SQLiteWorker.js');
    const worker = new Worker(url);

    let job: Queue | null = null; // Current item from the queue
    let error: Error | null = null; // Error that caused the worker to crash

    const takeWork = () => {
        if (!job && queue.length) {
            // If there's a job in the queue, send it to the worker
            job = queue.shift();
            worker.postMessage(job.message);
        }
    }

    worker
        .on('online', () => {
            workers.set(worker.threadId, { takeWork });
            takeWork();
        })
        .on('message', (result) => {
            job.event.emit('result', result);
            job = null;
            takeWork(); // Check if there's more work to do
        })
        .on('error', (err) => {
            error = err;
            job?.event.emit('error', err);
        })
        .on('exit', (code) => {
            workers.delete(worker.threadId);
            job?.event.emit('error', error || new Error('worker died'));
            
            if (code !== 0) {
                console.error(`worker exited with code ${code}`);
                spawn(); // Worker died, so spawn a new one
            }
        });
}

cpus().forEach(spawn);

const dir = await readdir(join(process.cwd(), 'assets/SQL/SQLite'));
const sql = dir.map(f => resolve(process.cwd(), 'assets/SQL/SQLite', f));

for (const file of sql) {
    const text = await readFile(file, 'utf-8');
    asyncQuery(text, { run: true });
}