import fetch from 'node-fetch';
import { deepStrictEqual, notDeepStrictEqual } from 'assert';

interface Poem {
    total: number
    verses: {
        id: string
        author: string
        username: string
        text: string
    }[]
    cursor: string
}

interface NoPoem {
    code: number
    metadata: { _internal_repr: any }
}

const base = 'https://us-central1-longest-poem-in-the-world.cloudfunctions.net/list-verses';
let cursor: string | null = null;

export const longestPoem = async () => {
    const res = await fetch(`${base}${cursor ? '?cursor=' + cursor : ''}`);
    const json = await res.json() as Poem | NoPoem;

    if('code' in json) return Promise.reject();
    deepStrictEqual('verses' in json, true);
    deepStrictEqual('cursor' in json, true);
    notDeepStrictEqual(json.verses.length, 0);

    cursor = encodeURIComponent(json.cursor); // must be encoded or we will get an error
    const text = json.verses
        .map(v => `[${v.text}](https://twitter.com/${v.username}/status/${v.id})`)
        .join('\n');

    return text;
}