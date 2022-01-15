import { KhafraClient } from '#khaf/Bot';
import { assets } from '#khaf/utility/Constants/Path.js';
import { join } from 'path';
import postgres from 'postgres';
import { env } from 'process';

const sqlFiles = KhafraClient.walk(
    join(assets, 'SQL/Postgres'),
    p => p.endsWith('.sql')
);

export const sql = postgres({
    user: env.POSTGRES_USER,
    pass: env.POSTGRES_PASS,
    database: 'kb',
    host: '127.0.0.1',
    onnotice: () => {}
});

for (const file of sqlFiles) {
    await sql.file<unknown[]>(file);
}