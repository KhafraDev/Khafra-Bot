import { asyncQuery } from '#khaf/database/SQLite.js';
import { Json } from '#khaf/utility/Constants/Path.js';
import { readFile } from 'fs/promises';

type Ret = { 'EXISTS(SELECT 1 from kbGarrison)': number };
interface Comic {
    href: string
    title: string
    link: string
}

export const migrateGarrison = async (): Promise<boolean> => {
    const r = await asyncQuery<Ret>('SELECT EXISTS(SELECT 1 from kbGarrison);');

    if (r[0]['EXISTS(SELECT 1 from kbGarrison)'] === 0) {
        const file = JSON.parse(
            await readFile(Json('Garrison.json'), 'utf-8')
        ) as Comic[];
        await garrisonTransaction(file);
    }

    return true;
}

export const garrisonTransaction = async (comics: Comic[]): Promise<void> => {
    for (const comic of comics) {
        await asyncQuery(`
            INSERT OR IGNORE INTO kbGarrison (
                href, link, title
            ) VALUES (
                ?, ?, ?
            );
        `, comic.href, comic.link, comic.title);
    }
}