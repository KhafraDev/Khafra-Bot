import { fetch, Response } from 'undici';
import { NounSearch } from './types/Noun.d';

const consumeBody = async (res: Response) => {
    if (res.body === null) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _chunk of res.body) {}
}

export const theNounProjectSearch = async (q: string): Promise<NounSearch | null> => {
    const res = await fetch(`https://thenounproject.com/search/json/icon/?q=${encodeURIComponent(q)}&page=1&limit=10&raw_html=false`, {
        headers: {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            // without the referer header, we get an empty object.
            // spaces are replaced with + in this URL, but still encoded
            'Referer': `https://thenounproject.com/search/?q=${encodeURIComponent(q.replace(/\s+/g, '+'))}`,
        }
    });
    
    if (!res.ok) {
        void consumeBody(res);

        return null
    }
    
    return await res.json() as NounSearch;
}