import { readFile } from 'fs/promises';
import { join } from 'path';
import { asyncQuery } from '../../Structures/Database/SQLite.js';
import { assets } from '../Utility/Constants/Path.js';

type Ret = { 'EXISTS(SELECT 1 from kbBranco)': number };
interface Comic {
    href: string
    title: string
    link: string
}

const PATH = join(assets, 'JSON/Branco.json');

export const migrateBranco = async () => {
    const r = await asyncQuery<Ret>(`SELECT EXISTS(SELECT 1 from kbBranco);`);

    if (r[0]['EXISTS(SELECT 1 from kbBranco)'] === 0) {
        const file = JSON.parse(await readFile(PATH, 'utf-8')) as Comic[];
        await brancoTransaction(file);
    }

    return true;
}

export const brancoTransaction = async (comics: Comic[]) => {
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