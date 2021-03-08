import { rand } from './Constants/OneLiners.js';

export function* chunk<T>(arr: T[], size: number) {
    for (let i = 0; i < arr.length; i += size) {
        yield arr.slice(i, i + size);
    }
}

export const shuffle = <T>(a: T[]): T[] => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export const realShuffle = async <T>(a: T[]): Promise<T[]> => {
    const c = Array.from(a); // don't modify OG array.
    for (let i = c.length - 1; i > 0; i--) {
        const j = await rand(i + 2); // min defaults to 0, allow i+1 to be chosen
        [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
}