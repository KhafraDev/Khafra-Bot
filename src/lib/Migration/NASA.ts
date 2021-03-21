import { pool } from '../../Structures/Database/Postgres.js';
import { apodFetchAll } from '../Backend/NASA.js';

interface INASA { 
    title: string, 
    link: string, 
    copyright: string | null 
}

export const nasaDBTransaction = async () => {
    const { rows } = await pool.query<{ exists: boolean }>(`SELECT EXISTS(SELECT 1 FROM kbAPOD);`);
    if (rows[0].exists === true)
        return true;
    
    const client = await pool.connect();
    const apodImages = await apodFetchAll();

    try {
        await client.query('BEGIN');

        for (const image of apodImages) {
            await client.query(`
                INSERT INTO kbAPOD (
                    title, link, copyright
                ) VALUES (
                    $1, $2, $3
                ) ON CONFLICT DO NOTHING;
            `, [image.title, image.link, image.copyright]);
        }

        await client.query('COMMIT');
    } catch {
        await client.query('ROLLBACK');
    } finally {
        client.release();
    }
}

export const nasaInsert = async (item: INASA) => {
    if (!item.title || !item.link)
        return;

    await pool.query(`
        INSERT INTO kbAPOD (
            title, link, copyright
        ) VALUES (
            $1, $2, $3
        ) ON CONFLICT DO NOTHING;
    `, [item.title, item.link, item.copyright]);
}