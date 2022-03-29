import { request } from 'undici';
import type { URL } from 'url';
import { consumeBody } from '#khaf/utility/FetchUtils.js';

export const talkObamaToMe = async (q: string): Promise<string> => {
    q = encodeURIComponent(q);

    const { context: ctx, body } = await request('http://talkobamato.me/synthesize.py', {
        method: 'POST',
        body: `input_text=${q}`,
        headers: {
            'Referer': 'http://talkobamato.me/',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        // https://github.com/nodejs/undici/pull/769
        maxRedirections: 1
    });

    const context = ctx as { history: URL[] };

    void consumeBody({ body });

    const u = context.history[context.history.length - 1];
    const speechKey = u.searchParams.get('speech_key');

    return `http://talkobamato.me/synth/output/${speechKey}/obama.mp4`;
}