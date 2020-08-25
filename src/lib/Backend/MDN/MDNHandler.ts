import fetch from "node-fetch";
import { MDNSearch } from "./types/MDN";

/**
 * Search MDN
 * @param q query
 */
export const mdn = (q: string) => {
    q = encodeURIComponent(q.replace(' ', '+'))

    return fetch('https://developer.mozilla.org/api/v1/search/en-US?q=' + q)
        .then(res => res.json() as Promise<MDNSearch>);
}