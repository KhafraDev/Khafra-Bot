import fetch from 'undici-fetch';
import { NounSearch } from './types/Noun'
import { deepStrictEqual } from 'assert';

export const theNounProjectSearch = async (q: string): Promise<NounSearch> => {
    let res;
    try {
        res = await fetch(`https://thenounproject.com/search/json/icon/?q=${encodeURIComponent(q)}&page=1&limit=10&raw_html=false`, {
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                // without the referer header, we get an empty object.
                // spaces are replaced with + in this URL, but still encoded
                'Referer': `https://thenounproject.com/search/?q=${encodeURIComponent(q.replace(/\s+/g, '+'))}`,
            }
        });
    } catch(e) {
        return Promise.reject(e);
    }
    
    deepStrictEqual(res.ok, true);
    deepStrictEqual(res.status, 200);
    
    try {
        const json = await res.json() as NounSearch;
        return json;
    } catch(e) {
        return Promise.reject(e);
    }
}