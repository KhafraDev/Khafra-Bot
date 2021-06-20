import fetch from 'undici-fetch';
import { once } from '../Utility/Memoize.js';

interface GoogleProduct {
    dateClose: string
    dateOpen: string
    description: string
    link: string
    name: string
    type: string
}

export const cache = new Set<GoogleProduct>();
export const categories = new Set<string>();

export const killedByGoogle = async () => {
    const res = await fetch('https://raw.githubusercontent.com/codyogden/killedbygoogle/main/graveyard.json');
    const json = await res.json() as GoogleProduct[];

    cache.clear();
    categories.clear();

    for (const category of json.map(i => i.type))
        categories.add(category.toLowerCase());

    const ageSorted = json.sort((a, b) => new Date(b.dateClose).getTime() - new Date(a.dateClose).getTime());
    for (const item of ageSorted)
        cache.add(item);

    return cache;
}

export const kbgSetInterval = once(async () => {
    await killedByGoogle().catch(() => {});
    return setInterval(
        () => killedByGoogle().catch(() => {}), 
        60 * 1000 * 60
    );
});