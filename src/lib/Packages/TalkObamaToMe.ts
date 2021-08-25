import { fetch } from 'undici';
import { URL } from 'url';

export const talkObamaToMe = async (q: string) => {
    q = encodeURIComponent(q);
    
    const res = await fetch('http://talkobamato.me/synthesize.py', {
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

    const location = res.headers.get('Location')!;
	const u = new URL(location).searchParams.get('speech_key');

	return `http://talkobamato.me/synth/output/${u}/obama.mp4`;
}