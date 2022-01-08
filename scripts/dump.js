import '../build/src/lib/Utility/load.env.js';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { env } from 'process';

export const sql = postgres({
    user: env.POSTGRES_USER,
    pass: env.POSTGRES_PASS,
    database: 'kb',
    host: '127.0.0.1',
    onnotice: () => {}
});

const tables = new Map([
    ['kbstonewall', 'Stonewall.json'], 
    ['kbgarrison', 'Garrison.json'], 
    ['kbbranco', 'Branco.json']
]);

for (const [table, file] of tables) {
    const rows = await sql`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_catalog = 'kb' AND table_name = ${table}::text
        );
    `;

    if (rows[0].exists === true) {
        const rows = await sql`SELECT * FROM ${table};`;
        const u = fileURLToPath(join(import.meta.url, `../../assets/${file}`));

        await writeFile(u, JSON.stringify(rows));
        console.log(`Dumped ${table} to ${u}`);
    }
}