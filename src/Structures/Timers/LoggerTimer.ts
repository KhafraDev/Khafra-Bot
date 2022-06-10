import { logger } from '#khaf/structures/Logger/FileLogger.js';
import { Timer } from '#khaf/Timer';
import { days } from '#khaf/utility/ms.js';
import { Blob } from 'node:buffer';
import { readFileSync, rmSync } from 'node:fs';
import { env } from 'node:process';
import { FormData, request } from 'undici';

const msSinceMidnight = (d = new Date()): number => {
    const e = new Date(d);
    return d.getTime() - e.setHours(0, 0, 0, 0);
}

export class LoggerTimer extends Timer {
    constructor () {
        super({ interval: 30 * 1000 });
    }

    async setInterval (): Promise<void> {
        for await (const i of this.yieldEvery(days(1) - msSinceMidnight())) {
            if (i !== 0) {
                await this.action().catch(
                    (err) => logger.error(err, 'logger rotation')
                );
                break;
            }
        }

        for await (const _ of this.yieldEvery(days(1))) {
            await this.action().catch(
                (err) => logger.error(err, 'logger rotation')
            );
        }
    }

    async action (cleanup = true): Promise<void> {
        if (!env.LOG_WEBHOOK) {
            return;
        }

        const path = logger.path;
        const file = new Blob([readFileSync(path)]);
        const fd = new FormData();
        fd.set('log.txt', file, 'log.txt');

        await request(env.LOG_WEBHOOK, {
            method: 'POST',
            body: fd
        });

        if (cleanup) {
            rmSync(path);
            logger.rotate();
        }
    }
}