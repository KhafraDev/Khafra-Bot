import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { once } from '#khaf/utility/Memoize.js';
import { setInterval } from 'node:timers';
import { request } from 'undici';

const top = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const art = 'https://hacker-news.firebaseio.com/v0/item/{id}.json';

export const cache = new Set<Story>();

interface Story {
    by: string
    descendants: number
    id: number
    kids: number[]
    score: number
    time: number
    title: string
    type: string
    url: string
}

const fetchTop = async (): Promise<number[]> => {
    const { body } = await request(top);
    const j = await body.json() as number[];

    return j.slice(0, 10);
}

const fetchEntries = async (): Promise<Story[]> => {
    const ids = await fetchTop();
    const stories: Story[] = [];

    for (const id of ids) {
        const { body } = await request(art.replace('{id}', `${id}`));
        const j = await body.json() as Story;
        stories.push(j);
    }

    cache.clear();
    stories.forEach(s => cache.add(s));

    return stories;
}

export const fetchHN = once(async () => {
    await dontThrow(fetchEntries());
    return setInterval(() => void dontThrow(fetchEntries()), 60 * 1000 * 10).unref();
});