import fetch from 'node-fetch';
import { deepStrictEqual } from 'assert';

interface ITronaldDumpQuote {
    appeared_at: Date
    created_at: Date
    quote_id: string
    tags: string[]
    updated_at: Date
    value: string
    _embedded: {
        author: {
            author_id: string,
            bio: null,
            created_at: Date,
            name: string,
            slug: string,
            updated_at: string,
            _links: { self: { href: string } }
        }[]
        source: {
            created_at: Date,
            filename: string | null,
            quote_source_id: string,
            remarks: string | null,
            updated_at: Date,
            url: string,
            _links: { self: { href: string } }
        }[]
    },
    _links: { self: { href: string } }
}

const url = 'https://api.tronalddump.io/random/quote';

export const trumpQuote = async () => {
    const res = await fetch(url, {
        headers: {
            Accept: 'application/json',
        }
    });
    const json = await res.json() as ITronaldDumpQuote;
    deepStrictEqual('error' in json, false);
    return json;
}