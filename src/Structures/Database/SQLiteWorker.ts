import { parentPort } from 'worker_threads';
import { Database } from 'better-sqlite3';

const dbs = new Map<string, Database>([
    // ['foobar', BetterSQLite3('foobar.db')]
]);

parentPort.on('message', ({ name, sql, parameters }) => {
    if (!dbs.has(name))
        return parentPort.postMessage(null);

    const db = dbs.get(name)!;
    const result = db.prepare(sql).all(...parameters);
    parentPort.postMessage(result);
});