import fetch from 'node-fetch';
import { deepStrictEqual } from 'assert';

export const talkObamaToMe = async (q: string) => {
    q = encodeURIComponent(q);
    let res;
    try {
        res = await fetch('http://talkobamato.me/synthesize.py', {
            method: 'POST',
            body: `input_text=${q}`,
            // don't redirect; allows us to extract Location header!
            // we could also remove this and check `res.redirected` and `res.url`.
            redirect: 'manual',
            headers: {
                'Referer': 'http://talkobamato.me/',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    } catch(e) {
        return Promise.reject(e);
    }

    deepStrictEqual(res.status, 302);
    return res.headers.get('Location');
}