import fetch from 'node-fetch';
import { 
    WikipediaError, 
    WikipediaSearch,
    WikipediaArticle,
    WikipediaArticleNotFound
} from './types/Wikipedia.d';

export const Wikipedia = async (q: string, language='en', limit?: number) => {
    if(typeof limit === 'number') {
        const res = await fetch(`https://${language}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=${limit}`);
        const json = await res.json() as WikipediaError | WikipediaSearch;
        return json;
    }

    const res = await fetch(`https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
    const json = await res.json() as WikipediaArticle | WikipediaArticleNotFound;
    return json;
}