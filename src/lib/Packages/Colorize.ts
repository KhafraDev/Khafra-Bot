import fetch from 'undici-fetch';
import { URL } from 'url';
import { deepStrictEqual, doesNotThrow } from 'assert';

type algorithmiaError = { error: { message: string } };
type algorithmiaSuccess = { result: string[], metadata: { content_type: string, duration: number } };

class AlgorithmiaError extends Error {
    constructor(m: string) { 
        super(m); 
        this.name = 'AlgorithmiaError';
    }
}

// good opportunity to learn how firefox formats the user agent
// otherwise this isnt required
const genUA = () => {
    const platforms = [
        'Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 11.1', 'X11; Linux i686', 
        'Linux x86_64', 'X11; Ubuntu; Linux i686', 'X11; Ubuntu; Linux x86_64',
        'X11; Fedora; Linux x86_64'
    ];
    
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const version = Math.floor(Math.random() * (99 - 84 + 1) + 84);

    return `Mozilla/5.0 (${platform}; rv:${version}) Gecko/20100101 Firefox/${version}`;
}

// https://demos.algorithmia.com/colorize-photos/public/js/main.js
const api_key = 'sim+n3uB2768dILYp8DOvjwR2FS1'; 

export const colorPhoto = async (url: URL) => {
    const res = await fetch('https://api.algorithmia.com/v1/web/algo/algorithmiahq/ColorizationDemo/1.1.24', {
        method: 'POST',
        headers: {
            'User-Agent': genUA(),
            'Accept': 'application/json, text/javascript',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://demos.algorithmia.com/colorize-photos',
            'Content-Type': 'application/json',
            'Authorization': `Simple ${api_key}`
        },
        body: JSON.stringify(url.href)
    });
    const json = await res.json() as algorithmiaError | algorithmiaSuccess;

    if ('error' in json) {
        return Promise.reject(new AlgorithmiaError(json.error.message));
    }

    deepStrictEqual(json.result.length > 2, true);
    doesNotThrow(() => new URL(json.result[2]));

    return json.result[2];
}