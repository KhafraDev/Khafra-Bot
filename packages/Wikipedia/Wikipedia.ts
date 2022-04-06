import { URLSearchParams } from 'node:url';
import { request } from 'undici';
import type {
    WikipediaSearch,
    WikipediaSummary
} from './types/Wikipedia';

/**
 * Search wikipedia using a given query. Returns an empty { pages: [...] } array if no results were found
 */
export const search = async (query: string): Promise<WikipediaSearch> => {
    const p = new URLSearchParams({ q: query, limit: '10' });
    /** @link https://api.wikimedia.org/wiki/Documentation/Code_samples/Search_Wikipedia#Searching_for_Wikipedia_articles_using_Python */
    const u = `https://api.wikimedia.org/core/v1/wikipedia/en/search/page?${p}`;

    const { body } = await request(u, {
        headers: {
            'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot)'
        }
    });

    return body.json() as Promise<WikipediaSearch>;
}

/**
 * Using a pageid, get an article's summary
 */
export const getArticleById = async (id: number): Promise<WikipediaSummary<number>> => {
    const p = new URLSearchParams({
        format: 'json',
        action: 'query',
        prop: 'extracts',
        redirects: '1',
        pageids: `${id}`
    });
    /** @link https://stackoverflow.com/a/28401782/15299271 */
    const u = `https://en.wikipedia.org/w/api.php?${p}&exintro&explaintext`;

    const { body } = await request(u, {
        headers: {
            'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot)'
        }
    });

    return body.json() as Promise<WikipediaSummary<typeof id>>;
}