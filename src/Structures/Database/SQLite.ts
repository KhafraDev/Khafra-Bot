import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Statement } from 'better-sqlite3';

type QueueItem = { 
    message: {
        name: string
        sql: string
        // so I don't have to live with the guilt of using any[]
        parameters: Parameters<Statement['all']>
    }
    resolve: (arg: unknown) => void; 
    reject: (arg: unknown) => void; 
}

const queue: QueueItem[] = [];
let workers: { takeWork: () => void }[] = [];

export const sqlite3Queue = (name: string, sql: string, ...parameters: Parameters<Statement['all']>) => {
    return new Promise<unknown>((resolve, reject) => {
        queue.push({
            resolve,
            reject,
            message: { name, sql, parameters },
        });
        drainQueue();
    });
}

const drainQueue = () => {
    for (const worker of workers) {
        worker.takeWork();
    }
}

const spawn = () => {
    const url = resolve(fileURLToPath(import.meta.url), '../SQLiteWorker.js');
    const worker = new Worker(url);

    let job: QueueItem | null = null; // Current item from the queue
    let error: Error = null; // Error that caused the worker to crash

    const takeWork = () => {
        if (job === null && queue.length !== 0) {
            job = queue.shift();
            worker.postMessage(job.message);
        }
    }

    worker
        .on('online', () => {
            workers.push({ takeWork });
            takeWork();
        })
        .on('message', (result) => {
            job.resolve(result);
            job = null;
            takeWork(); // Check if there's more work to do
        })
        .on('error', (err) => {
            error = err;
        })
        .on('exit', (code) => {
            workers = workers.filter(w => w.takeWork !== takeWork);
            job?.reject(error ?? new Error('worker died'));
            
            if (code !== 0)
                spawn(); // Worker died, so spawn a new one
        });
}

if (cpus().length !== 1)
    cpus().forEach(spawn);