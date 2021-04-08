import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';

const loadSQL = await readFile(join(process.cwd(), 'assets/SQL/init.sql'), 'utf-8');

export const pool = new pg.Pool({
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASS!,
    database: 'kb'
});

// create tables and other defaults if needed
await pool.query(loadSQL);
