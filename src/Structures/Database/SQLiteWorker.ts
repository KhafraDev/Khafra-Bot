import { parentPort } from 'worker_threads';
import BetterSQLite3 from 'better-sqlite3';
import { join } from 'path/posix';

interface Opts {
    run: boolean
}

interface Params {
    sql: string
    parameters: unknown[]
    opts: Opts | undefined
}

const assets = join(process.cwd(), 'assets/khafrabot.db');
const db = BetterSQLite3(assets);

parentPort.on('message', ({ sql, parameters, opts }: Params) => {
    try {
        const result = opts?.run
            ? db.prepare<unknown[]>(sql).run(...parameters)
            : db.prepare<unknown[]>(sql).all(...parameters);
        parentPort.postMessage(result);
    } catch (e) {
        console.log(e);
        parentPort.postMessage(null);
    }
});