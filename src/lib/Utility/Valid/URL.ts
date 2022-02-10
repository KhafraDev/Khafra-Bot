import { URL } from 'url';

interface ValidURL {
    url: URL | null
    idx: number
}

interface FactoryOpts {
    stripParams?: boolean
}

const defaultOpts: FactoryOpts = {
    stripParams: true
}

/**
 * Checks if a string is a valid https or http link and returns a URL object if it is. 
 * Otherwise returns null.
 * 
 * Validates protocol, username, and password, and removes all search params.
 */
export const URLFactory = (s: string, opts: FactoryOpts = defaultOpts): URL | null => {
    try {
        const url = new URL(s);
        if (url.protocol !== 'https:' && url.protocol !== 'http:')
            return null;
        if (url.username !== '' || url.password !== '')
            return null;

        if (opts.stripParams === true) {
            for (const key of Array.from(url.searchParams.keys())) {
                url.searchParams.delete(key);
            }
        }
        
        return url;
    } catch {
        return null;
    }
}

/**
 * Gives a string or array of strings, tests for every URL present and returns a list 
 * of them with an index (when an array is passed.
 */
export function validURL(s: string): Omit<ValidURL, 'idx'>;
export function validURL(s: string[]): ValidURL[];
export function validURL(s: string | string[]): Omit<ValidURL, 'idx'> | ValidURL[] {
    if (Array.isArray(s)) {
        const valid: ValidURL[] = [];
        for (let i = 0; i < s.length; i++) {
            const url = URLFactory(s[i]);
            if (url !== null)
                valid.push({ url, idx: i });
        }

        return valid;
    }

    return { url: URLFactory(s) };
}