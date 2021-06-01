import { parentPort } from 'worker_threads';
import BetterSQLite3 from 'better-sqlite3';
import { join } from 'path/posix';

const assets = join(process.cwd(), 'assets/khafrabot.db');
const db = BetterSQLite3(assets);

parentPort.on('message', ({ sql, parameters, opts }) => {
    try {
        const result = opts?.run
            ? db.prepare(sql).run(...parameters)
            : db.prepare(sql).all(...parameters);
        parentPort.postMessage(result);
    } catch (e) {
        console.log(e);
        parentPort.postMessage(null);
    }
});