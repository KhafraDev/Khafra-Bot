import '../build/src/lib/Utility/load.env.js';
import { pool } from '../build/src/Structures/Database/Postgres.js';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const tables = new Map([
    ['kbstonewall', 'Stonewall.json'], 
    ['kbgarrison', 'Garrison.json'], 
    ['kbbranco', 'Branco.json']
]);

for (const [table, file] of tables) {
    const { rows } = await pool.query(`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_catalog = 'kb' AND table_name = $1::text
        );
    `, [table]);

    if (rows[0].exists === true) {
        const { rows } = await pool.query(`SELECT * FROM ${table};`);
        const u = fileURLToPath(join(import.meta.url, `../../assets/${file}`));

        await writeFile(u, JSON.stringify(rows));
        console.log(`Dumped ${table} to ${u}`);
    }
}