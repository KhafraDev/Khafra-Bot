import { readFile } from 'fs/promises';
import { join } from 'path';
import { asyncQuery } from '../../Structures/Database/SQLite.js';
import { assets } from '../Utility/Constants/Path.js';

type Ret = { 'EXISTS(SELECT 1 from kbGarrison)': number };
interface Comic {
    href: string
    title: string
    link: string
}

const PATH = join(assets, 'JSON/Garrison.json');

export const migrateGarrison = async () => {
    const r = await asyncQuery<Ret>(`SELECT EXISTS(SELECT 1 from kbGarrison);`);

    if (r[0]['EXISTS(SELECT 1 from kbGarrison)'] === 0) {
        const file = JSON.parse(await readFile(PATH, 'utf-8')) as Comic[];
        await garrisonTransaction(file);
    }

    return true;
}

export const garrisonTransaction = async (comics: Comic[]) => {
    for (const comic of comics) {
        await asyncQuery(`
            INSERT OR IGNORE INTO kbGarrison (
                href, link, title
            ) VALUES (
                ?, ?, ?
            );
        `, { run: true }, comic.href, comic.link, comic.title);
    }
}