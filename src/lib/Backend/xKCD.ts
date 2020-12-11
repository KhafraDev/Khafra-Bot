import fetch from 'node-fetch';
import { chunk } from '../Utility/Array.js';
import { join } from 'path';
import { writeFile, readFile } from 'fs/promises';

interface xKCDLike {
    month: string
    num: number
    link: string
    year: string
    news: string
    safe_title: string
    transcript: string
    alt: string
    img: string
    title: string
    day: string
}

export type xKCDFormatted = Omit<
    xKCDLike, 
    'year' | 'month' | 'day' | 'link' | 'news' | 'transcript' | 'title' | 'alt'
> & { date: string };

const path = join(process.cwd(), 'assets/xkcd.json');

const getLatest = async () => {
    const latest = await fetch('https://xkcd.com/info.0.json');
    const latestJSON = await latest.json() as xKCDLike;

    return latestJSON.num ?? 2396;
}

/**
 * Fetch all articles in batches of 10 and re-write the cache file.
 * Not used by the bot but could be useful in the future.
 */
export const fetchAll = async () => {
    const length = await getLatest();

    const list: xKCDLike[] = [];
    const arrs = [...chunk(Array.from({ length }, (_, i) => i + 1), 10)];

    while(arrs.length !== 0) {
        const pr = arrs.shift().map(n => fetch(`https://xkcd.com/${n}/info.0.json`));
        const all = await Promise.all(pr);

        const json = await Promise.all<xKCDLike>(all.filter(r => r.ok).map(j => j.json()));
        list.push(...json);
    }

    const f: xKCDFormatted[] = list.map(d => ({
        date: `${d.year}-${d.month.padStart(2, '0')}-${d.day.padStart(2, '0')}`,
        num: d.num,
        safe_title: d.safe_title,
        img: d.img
    }));

    return await writeFile(path, JSON.stringify(f, null, 2));
}

/**
 * Fetch new articles in batches of 10 and append the cache file.
 */
export const fetchNew = async () => {
    const cache = JSON.parse(await readFile(path, 'utf-8')) as xKCDFormatted[];

    const length = await getLatest();
    const last = cache.sort((a, b) => b.num - a.num).shift().num;

    const list: xKCDLike[] = [];
    const arrs = [...chunk(Array.from({ length: length - last }, (_, i) => length - i), 10)];

    while(arrs.length !== 0) {
        const pr = arrs.shift().map(n => fetch(`https://xkcd.com/${n}/info.0.json`));
        const all = await Promise.all(pr);

        const json = await Promise.all<xKCDLike>(all.filter(r => r.ok).map(j => j.json()));
        list.push(...json);
    }

    const f: xKCDFormatted[] = list.map(d => ({
        date: `${d.year}-${d.month.padStart(2, '0')}-${d.day.padStart(2, '0')}`,
        num: d.num,
        safe_title: d.safe_title,
        img: d.img
    }));

    const c = cache.concat(f);
    return await writeFile(path, JSON.stringify(c, null, 2));
}