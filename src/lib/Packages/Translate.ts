/*
 * Originally based VERY-roughly on https://github.com/DarinRowe/googletrans (v1.0.0, MIT license).
 * Refined from this comment, https://github.com/matheuss/google-translate-api/issues/79#issuecomment-426007365,
 * that removes the token entirely.
 */

import fetch from 'node-fetch';
import { URL, URLSearchParams } from 'url';

type Opts = { to?: string, from?: string };

export const langs = [
	'auto', 'af', 'sq', 'am', 'ar', 
	'hy', 'az', 'eu', 'be', 'bn', 
	'bs', 'bg', 'ca', 'ceb', 'ny', 
	'zh', 'zh-cn', 'zh-sg', 'zh-tw',
    'zh-hk', 'co',  'hr',  'cs', 'da', 
	'nl', 'en', 'eo', 'et', 'tl', 
	'fi', 'fr', 'fy', 'gl', 'ka', 
	'de', 'el', 'gu', 'ht', 'ha', 
	'haw', 'he', 'iw', 'hi', 'hmn', 
	'hu', 'is', 'ig', 'id', 'ga', 
	'it', 'ja', 'jw', 'kn', 'kk', 
	'km', 'ko', 'ku', 'ky', 'lo', 
	'la', 'lv', 'lt', 'lb', 'mk', 
	'mg', 'ms', 'ml', 'mt', 'mi', 
	'mr', 'mn', 'my', 'ne', 'no', 
	'ps', 'fa', 'pl', 'pt', 'pa', 
	'ro', 'ru', 'sm', 'gd', 'sr', 
	'st', 'sn', 'sd', 'si', 'sk', 
	'sl', 'so', 'es', 'su', 'sw', 
	'sv', 'tg', 'ta', 'te', 'th', 
	'tr', 'uk', 'ur', 'uz', 'vi', 
	'cy', 'xh', 'yi', 'yo', 'zu', 'fil', 
];

const staticParams = new URLSearchParams([
    ['client', 'gtx'],
    ['hl', 'en'],
    ['dt', 'at'], ['dt', 'bd'], ['dt', 'ex'], ['dt', 'ld'], ['dt', 'md'], 
    ['dt', 'qca'], ['dt', 'rw'], ['dt', 'rm'], ['dt', 'ss'], ['dt', 't'],
    ['ie', 'UTF-8'],
    ['oe', 'UTF-8'],
    ['otf', '1'],
    ['ssel', '0'],
    ['tsel', '0'],
    ['kc', '7']
]);

export const translate = async (
	text: string, 
	opts: Opts = { to: 'en', from: 'auto' }
): Promise<string> => {
	opts.from = langs.includes(opts.from?.toLowerCase()) ? opts.from.toLowerCase() : 'auto';
	opts.to = langs.includes(opts.to?.toLowerCase()) ? opts.to.toLowerCase() : 'en';

	const url = 'https://translate.google.com/translate_a/single?';
	const params = new URLSearchParams(staticParams);
    params.append('sl', opts.from);
    params.append('tl', opts.to);
    params.append('q', text);

    const r = await fetch(new URL(`?${params}`, url), {
        headers: {
            'Accept-Encoding': 'gzip, deflate, br',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0'
        }
    });
	// setting real types for this is a waste of time
    const j = await r.json() as unknown[][][];

	if (!Array.isArray(j) || !Array.isArray(j[0]))
		return 'Invalid response received!';
	 
	return j[0].map(tr => tr.shift()).join('');
}