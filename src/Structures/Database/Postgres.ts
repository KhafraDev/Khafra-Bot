import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import pg from 'pg';

const dir = await readdir(join(process.cwd(), 'assets/SQL'));

export const pool = new pg.Pool({
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASS!,
    database: 'kb'
});

// create tables and other defaults if needed
const sql = dir.map(f => resolve(process.cwd(), 'assets/SQL', f));

for (const file of sql) {
    const text = await readFile(file, 'utf-8');
    await pool.query(text);
}