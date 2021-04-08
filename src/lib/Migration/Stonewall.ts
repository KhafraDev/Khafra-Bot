import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from '../../Structures/Database/Postgres.js';

interface Comic {
    href: string
    title: string
    link: string
}

const PATH = join(process.cwd(), 'assets/Stonewall.json');

export const migrateStonewall = async () => {
    const { rows } = await pool.query<{ exists: boolean }>(`SELECT EXISTS(SELECT 1 FROM kbStonewall);`);
    if (rows[0].exists === false) {
        const file = JSON.parse(await readFile(PATH, 'utf-8')) as Comic[];
        await stonewallTransaction(file);
    }

    return true;
}

export const stonewallTransaction = async (comics: Comic[]) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const comic of comics) {
            await client.query(`
                INSERT INTO kbStonewall (
                    href, link, title
                ) VALUES (
                    $1, $2, $3
                ) ON CONFLICT DO NOTHING;
            `, [comic.href, comic.link, comic.title]);
        }

        await client.query('COMMIT');
    } catch {
        await client.query('ROLLBACK');
    } finally {
        client.release();
    }
}