import { parentPort } from 'worker_threads';
import BetterSQLite3 from 'better-sqlite3';
import { join } from 'path';
import { assets } from '../../lib/Utility/Constants/Path.js';

export interface Opts {
    run?: boolean,
    get?: boolean
}

interface Params {
    sql: string
    parameters: unknown[]
    opts: Opts | undefined
}

const assetsPath = join(assets, 'khafrabot.db');
const db = BetterSQLite3(assetsPath);

db.pragma('journal_mode = WAL');

parentPort!.on('message', ({ sql, parameters, opts }: Params) => {    
    try {
        const result: unknown[] = [];
        if (opts?.get) {
            result.push(db.prepare<unknown[]>(sql).get(...parameters));
        } else if (opts?.run) {
            result.push(db.prepare<unknown[]>(sql).run(...parameters));
        } else {
            result.push(...db.prepare<unknown[]>(sql).all(...parameters));
        }

        parentPort!.postMessage(result);
    } catch (e) {
        console.log(e);
        parentPort!.postMessage(null);
    }
});