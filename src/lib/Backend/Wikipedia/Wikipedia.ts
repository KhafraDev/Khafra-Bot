import fetch from 'node-fetch';
import { WikipediaError, WikipediaSearch } from './types/Wikipedia.d';

export const Wikipedia = async (q: string, limit=1, language='en') => {
    const res = await fetch(`https://${language}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=${limit}`);
    const json = await res.json() as WikipediaError | WikipediaSearch;

    return json;
}