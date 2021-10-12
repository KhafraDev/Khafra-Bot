import { Database } from 'esqlite';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { KhafraClient } from '../../Bot/KhafraBot.js';
import { assets } from '../../lib/Utility/Constants/Path.js';
import { once } from '../../lib/Utility/Memoize.js';

const dbPath = join(assets, 'khafrabot.db');
const db = new Database(dbPath);
db.open();

type Message<T extends unknown[]> = { 
    sql: string
    parameters: T
}

export const asyncQuery = async <T, P extends unknown[] = string[]>(
    sql: string, 
    ...parameters: Message<P>['parameters']
) => {
    await load();
    
    return new Promise<T[]>((res, rej) => {
        db.query<T>(sql, parameters, (err, rows) => {
            return err !== null ? rej(err) : res(rows);
        });
    });
}

export const load = once(async () => {
    const sql = await KhafraClient.walk(join(assets, 'SQL/SQLite'), p => p.endsWith('.sql'));

    for (const file of sql) {
        const text = await readFile(file, 'utf-8');
        const queries = text
            .split(';')
            .map(l => l.trim())
            .filter(l => l.length > 0);
    
        for (const query of queries)
            void asyncQuery(`${query};`);
    }
});