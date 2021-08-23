import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import pg from 'pg';

export const defaultKGuild = [
    'prefix',
    'mod_log_channel',
    'max_warning_points',
    'welcome_channel',
    'reactRoleChannel',
    'ticketChannel'
].join(', ');

const dir = await readdir(join(process.cwd(), 'assets/SQL/Postgres'));

export const pool = new pg.Pool({
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASS!,
    database: 'kb'
});

// create tables and other defaults if needed
const sql = dir.map(f => resolve(process.cwd(), 'assets/SQL/Postgres', f));

for (const file of sql) {
    const text = await readFile(file, 'utf-8');
    await pool.query(text);
}