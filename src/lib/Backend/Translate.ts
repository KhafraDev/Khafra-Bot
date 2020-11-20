/**
 * Based VERY-roughly on {@see https://github.com/DarinRowe/googletrans} (v1.0.0, MIT license).
 * Only uses the URL logic (params, base url) to get a valid response.
 */

import fetch from "node-fetch";
import { URLSearchParams } from "url";

const token = (a: string) => {
	const arb_1 = 406644, arb_2 = 3293161072,
	      jd = '.', $b = '+-a^+6', Zb = '+-3^+b+-f', e = [];

    for(let f = 0, g = 0; g < a.length; g++) {
        let m = a.charCodeAt(g);
        if(m < 128) {
            e[f++] = m;
        } else if(m < 2048) {
            e[f++] = (m >> 6) | 192;
        } else if(55296 === (m & 64512) && g + 1 < a.length && 56320 === (a.charCodeAt(g + 1) & 64512)) {
            m = 65536 + ((m & 1023) << 10) + (a.charCodeAt(++g) & 1023);
            e[f++] = (m >> 18) | 240; 
            e[f++] = ((m >> 12) & 63) | 128;
        } else {
            e[f++] = (m >> 12) | 224; 
            e[f++] = ((m >> 6) & 63) | 128; 
            e[f++] = (m & 63) | 128;
        }
	}
	
    let arb_1_clone = arb_1;
    for (let f = 0; f < e.length; f++) {
		arb_1_clone += e[f];
		arb_1_clone = arb_fn(arb_1_clone, $b);
	};
    arb_1_clone = arb_fn(arb_1_clone, Zb);
	arb_1_clone ^= arb_2 || 0;
	// 												 2 ** 32 (-1)
    0 > arb_1_clone && (arb_1_clone = (arb_1_clone & 2147483647) + 2147483648);
    arb_1_clone %= 1e6;
    return arb_1_clone.toString() + jd + (arb_1_clone ^ arb_1);
}

const arb_fn = (p_1: number, p_2: string) => {
	for (let c = 0; c < p_2.length - 2; c += 3) {
		const d = p_2.charAt(c + 2);
		const e = d >= 'a' ? d.charCodeAt(0) - 87 : Number(d);
    	const f = p_2.charAt(c + 1) === '+' ? p_1 >>> e : p_1 << e;
    	p_1 = p_2.charAt(c) === '+' ? (p_1 + f) & 4294967295 : p_1 ^ f;
  	}
  	return p_1;
}

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

export const translate = async (
	text: string, 
	opts: { to: string, from: string } = { to: 'en', from: 'auto' }
) => {
	opts.from = langs.includes(opts.from?.toLowerCase()) ? opts.from.toLowerCase() : 'auto';
	opts.to = langs.includes(opts.to?.toLowerCase()) ? opts.to.toLowerCase() : 'en';

	const url = 'https://translate.google.com/translate_a/single?';
  	const PARAMS: [string, string][] = [
		['client', 't'],
		['sl', opts.from],
		['tl', opts.to],
		['hl', 'en'],
		['dt', 'at'], ['dt', 'bd'], ['dt', 'ex'], ['dt', 'ld'], ['dt', 'md'], 
		['dt', 'qca'], ['dt', 'rw'], ['dt', 'rm'], ['dt', 'ss'], ['dt', 't'],
		['ie', 'UTF-8'],
		['oe', 'UTF-8'],
		['otf', '1'],
		['ssel', '0'],
		['tsel', '0'],
		['kc', '7'],
		['q', text],
		['tk', token(text)],
	];

	let json: any[][];
	try {
		const res = await fetch(url + new URLSearchParams(PARAMS).toString(), {
			headers: {
				'Accept-Encoding': 'gzip, deflate, br',
			}
		});
		json = await res.json();
	} catch(e) {
		return Promise.reject(e);
	} 

	return json?.[0].map(tr => tr.shift()).join('') ?? 'Bad response!';
}