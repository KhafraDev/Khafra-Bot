import fetch from 'node-fetch';

const top = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const art = 'https://hacker-news.firebaseio.com/v0/item/{id}.json';

export const cache = new Map<number, story>();
let interval: NodeJS.Timeout | null = null;

interface story {
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
    const stories: story[] = [];

    for(const id of ids) {
        const r = await fetch(art.replace('{id}', `${id}`));
        const j = await r.json() as story;
        stories.push(j);
    }

    cache.clear();
    Object.entries(stories).map(([idx, sty]) => cache.set(+idx, sty));
}

const safeFetchHN = async () => fetchEntries().catch(() => {});

export const fetchHN = async () => {
    if(interval) return interval;

    await safeFetchHN();
    interval = setInterval(safeFetchHN, 60 * 1000 * 10);
}