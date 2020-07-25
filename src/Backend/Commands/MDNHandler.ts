import fetch from "node-fetch";

/**
 * Get the search result page's HTML
 * @param q query
 */
export const mdn = (q: string) => {
    q = encodeURIComponent(q.replace(' ', '+'))

    return fetch('https://developer.mozilla.org/en-US/search?q=' + q)
        .then(res => res.text());
}