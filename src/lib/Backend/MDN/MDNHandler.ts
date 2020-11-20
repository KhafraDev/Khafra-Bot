import fetch from "node-fetch";
import { MDNSearch } from "./types/MDN";

/**
 * Search MDN
 * @param q query
 */
export const mdn = async (q: string) => {
    q = encodeURIComponent(q.replace(' ', '+'))

    try {
        const res = await fetch('https://developer.mozilla.org/api/v1/search/en-US?q=' + q);
        const json = await res.json() as MDNSearch;

        return json;
    } catch(e) {
        return Promise.reject(e);
    }
}