import { fetch } from 'undici';
import { dontThrow } from '../Utility/Don\'tThrow.js';
import { once } from '../Utility/Memoize.js';

const top = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const art = 'https://hacker-news.firebaseio.com/v0/item/{id}.json';

export const cache = new Set<Story>();

interface Story {
    by: string
    descendants: number
    id: number,
    kids: number[]
    score: number
    time: number
    title: string
    type: string
    url: string
}

const fetchTop = async () => {
    const r = await fetch(top);
    const j = await r.json() as number[];

    return j.slice(0, 10);
}

const fetchEntries = async () => {
    const ids = await fetchTop();
    const stories: Story[] = [];

    for (const id of ids) {
        const r = await fetch(art.replace('{id}', `${id}`));
        const j = await r.json() as Story;
        stories.push(j);
    }

    cache.clear();
    stories.forEach(s => cache.add(s));

    return stories;
}

export const fetchHN = once(async () => {
    await dontThrow(fetchEntries());
    return setInterval(() => dontThrow(fetchEntries()), 60 * 1000 * 10).unref();
});