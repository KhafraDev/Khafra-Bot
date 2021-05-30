import { readFile } from 'fs/promises';
import { join } from 'path';
import { pool } from '../../Structures/Database/Postgres.js';

interface Comic {
    href: string
    title: string
    link: string
}

const PATH = join(process.cwd(), 'assets/Branco.json');

export const migrateBranco = async () => {
    const { rows } = await pool.query<{ exists: boolean }>(`SELECT EXISTS(SELECT 1 FROM kbBranco);`);
    if (rows[0].exists === false) {
        const file = JSON.parse(await readFile(PATH, 'utf-8')) as Comic[];
        await brancoTransaction(file);
    }

    return true;
}

export const brancoTransaction = async (comics: Comic[]) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const comic of comics) {
            await client.query(`
                INSERT INTO kbBranco (
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