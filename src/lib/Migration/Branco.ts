import { asyncQuery } from '#khaf/database/SQLite.js';
import { Json } from '#khaf/utility/Constants/Path.js';
import { readFile } from 'fs/promises';

type Ret = { 'EXISTS(SELECT 1 from kbBranco)': number };
interface Comic {
    href: string
    title: string
    link: string | null
}

export const migrateBranco = async (): Promise<boolean> => {
    const r = await asyncQuery<Ret>('SELECT EXISTS(SELECT 1 from kbBranco);');

    if (r[0]['EXISTS(SELECT 1 from kbBranco)'] === 0) {
        const file = JSON.parse(
            await readFile(Json('Branco.json'), 'utf-8')
        ) as Comic[];
        await brancoTransaction(file);
    }

    return true;
}

export const brancoTransaction = async (comics: Comic[]): Promise<void> => {
    for (const comic of comics) {
        await asyncQuery(`
            INSERT OR IGNORE INTO kbBranco (
                href, link, title
            ) VALUES (
                ?, ?, ?
            );
        `, comic.href, comic.link, comic.title);
    }
}