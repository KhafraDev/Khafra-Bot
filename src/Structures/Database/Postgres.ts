import { readFile } from 'fs/promises';
import { join } from 'path';
import pg from 'pg';
import { KhafraClient } from '../../Bot/KhafraBot.js';
import { assets } from '#khaf/utility/Constants/Path.js';

export const defaultKGuild = [
    'prefix',
    'mod_log_channel',
    'max_warning_points',
    'welcome_channel',
    'reactRoleChannel',
    'ticketChannel'
].join(', ');

const sql = await KhafraClient.walk(join(assets, 'SQL/Postgres'), p => p.endsWith('.sql'));

export const pool = new pg.Pool({
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASS!,
    database: 'kb',
    host: '127.0.0.1'
});

for (const file of sql) {
    const text = await readFile(file, 'utf-8');
    await pool.query(text);
}