import FormData from '@discordjs/form-data';
import fetch from 'node-fetch';
import parse5, {
    DefaultTreeParentNode as DTPN,
    DefaultTreeElement as DTE,
    DefaultTreeChildNode as DTCN
} from 'parse5';
import { deepStrictEqual } from 'assert';
import { MessageAttachment } from 'discord.js';
import { lookup } from 'mime-types';

const getA = (html: string) => {
    const document = parse5.parse(html);
    const els = (document as DTPN).childNodes; // elements in the page's body
    const a = [];

    while(els.length !== 0) {
        const el = els.shift() as DTCN | DTPN;
        if(el.nodeName === 'a') {
            if(
                (el as DTE).attrs.every(a => ['download', 'href'].includes(a.name)) &&
                (el as DTCN).parentNode.nodeName === 'div'
            ) {
                a.push(el);
            }
        } else if((el as DTPN).childNodes?.length > 0) {
            els.push(...(el as DTPN).childNodes);
        }
    }

    return a as (DTE & DTPN)[];
}

/**
 * Cartoonize an image using AI from an "unofficial API".
 * Involves HTML scraping.
 * @throws {TypeError | AssertionError | FetchError}
 */
export const cartoonize = async (attachment: MessageAttachment) => {
    const mime = lookup(attachment.name);
    deepStrictEqual(typeof mime !== 'boolean', true);

    const res = await fetch(attachment.proxyURL);
    deepStrictEqual(res.status, 200);
    const buffer = await res.buffer();
    const form = new FormData();
    form.append('image', buffer, {
        filename: attachment.name,
        contentType: mime as string,
        knownLength: buffer.byteLength
    });

    const cartoonizeRes = await fetch('https://cartoonize-lkqov62dia-de.a.run.app/cartoonize', {
        method: 'POST',
        headers: form.getHeaders(),
        body: form
    });

    deepStrictEqual(cartoonizeRes.status, 200);
    const a = getA(await cartoonizeRes.text());
    deepStrictEqual(a.length, 1);

    return a.shift().attrs.find(attr => attr.name === 'href').value;
}