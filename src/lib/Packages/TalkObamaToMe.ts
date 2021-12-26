import { fetch } from 'undici';
import { URL } from 'url';
import { consumeBody } from '#khaf/utility/FetchUtils.js';

export const talkObamaToMe = async (q: string) => {
    q = encodeURIComponent(q);
    
    const res = await fetch('http://talkobamato.me/synthesize.py', {
        method: 'POST',
        body: `input_text=${q}`,
        headers: {
            'Referer': 'http://talkobamato.me/',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!res.redirected) {
        throw new Error('Request wasn\'t redirected!');
    }

	const u = new URL(res.url).searchParams.get('speech_key');

    void consumeBody(res);

	return `http://talkobamato.me/synth/output/${u}/obama.mp4`;
}