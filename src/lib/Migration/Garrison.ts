import { existsSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';
import { pool } from '../../Structures/Database/Postgres.js';

interface Comic {
    href: string
    title: string
    link: string
}

const PATH = join(process.cwd(), 'assets/Garrison.json');

export const migrateGarrison = async () => {
    const exists = existsSync(PATH);
    if (exists) {
        const file = JSON.parse(await readFile(PATH, 'utf-8')) as Comic[];
        await garrisonTransaction(file);
        
        await rm(PATH);
    }
    return true;
}

export const garrisonTransaction = async (comics: Comic[]) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const comic of comics) {
            await client.query(`
                INSERT INTO kbGarrison (
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