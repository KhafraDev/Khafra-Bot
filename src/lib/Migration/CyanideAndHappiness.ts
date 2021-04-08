import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from '../../Structures/Database/Postgres.js';

interface Comic {
    href: string
    link: string
    title: string
}

const PATH = join(process.cwd(), 'assets/CyanideAndHappiness.json');

export const migrateCAH = async () => {
    const { rows } = await pool.query<{ exists: boolean }>(`SELECT EXISTS(SELECT 1 FROM kbCAH);`);
    if (rows[0].exists === false) {
        const file = JSON.parse(await readFile(PATH, 'utf-8')) as Comic[];
        await cahTransaction(file);
    }

    return true;
}

export const cahTransaction = async (comics: Comic[]) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const comic of comics) {
            await client.query(`
                INSERT INTO kbCAH (
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