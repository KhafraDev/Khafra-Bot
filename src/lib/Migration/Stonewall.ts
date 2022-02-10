import { readFile } from 'fs/promises';
import { join } from 'path';
import { asyncQuery } from '#khaf/database/SQLite.js';
import { assets } from '#khaf/utility/Constants/Path.js';

type Ret = { 'EXISTS(SELECT 1 from kbStonewall)': number };
interface Comic {
    href: string
    title: string
    link: string
}

const PATH = join(assets, 'JSON/Stonewall.json');

export const migrateStonewall = async (): Promise<boolean> => {
    const r = await asyncQuery<Ret>(`SELECT EXISTS(SELECT 1 from kbStonewall);`);

    if (r[0]['EXISTS(SELECT 1 from kbStonewall)'] === 0) {
        const file = JSON.parse(await readFile(PATH, 'utf-8')) as Comic[];
        await stonewallTransaction(file);
    }

    return true;
}

export const stonewallTransaction = async (comics: Comic[]): Promise<void> => {
    for (const comic of comics) {
        await asyncQuery(`
            INSERT OR IGNORE INTO kbStonewall (
                href, link, title
            ) VALUES (
                ?, ?, ?
            );
        `, comic.href, comic.link, comic.title);
    }
}