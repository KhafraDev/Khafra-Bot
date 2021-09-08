// https://www.thisfuckeduphomerdoesnotexist.com/
// had to include this one

import { fetch } from 'undici';

interface ISimpson {
    url: string
    key: string
    next_item_key: string
    next_item_url: string
    transition_url: string
    permalink: string
}

const url = 'https://www.thisfuckeduphomerdoesnotexist.com/';
let key: string | null = null;

export const fetchOGKey = async () => {
    const res = await fetch(url);
    const text = await res.text();

    return /"next_item_key": "(?<key>.*?)"/.exec(text)?.groups?.key ?? null;
}

export const thisSimpsonDoesNotExist = async () => {
    key ??= await fetchOGKey();

    const res = await fetch(`${url}item/${key}`);
    const json = await res.json() as ISimpson;

    key = json.next_item_key;
    return json.next_item_url;
}