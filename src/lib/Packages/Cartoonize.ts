import FormData from '@discordjs/form-data';
import { MessageAttachment } from 'discord.js';
import { decodeXML } from 'entities';
import https from 'https';
import { lookup } from 'mime-types';
import fetch from 'undici-fetch';
import { URL } from 'url';

/*** Get the image from the html */
const R = /<div class="image">\s+<img src="(.*?)">/;

/**
 * Cartoonize an image using AI from an "unofficial API".
 * Involves HTML scraping.
 * @throws {TypeError | AssertionError | FetchError}
 */
export const cartoonize = async (attachment: MessageAttachment) => {
    const m = `${lookup(attachment.name)}`;
    const r = await fetch(attachment.proxyURL);
    const f = new FormData();

    f.append('image', await r.arrayBuffer(), {
        filename: attachment.name,
        contentType: m
    });

    return new Promise<string>((done, reject) => {
        const request = https.request(new URL('https://cartoonize-lkqov62dia-de.a.run.app/cartoonize'), {
            method: 'POST',
            headers: f.getHeaders()
        }, async (res) => {
            let data = '';
            
            for await (const chunk of res) {
                data += `${chunk}`;
            }

            return done(decodeXML(R.exec(data)[1]));
        });
        
        f.pipe(request);
        
        request.end();
        request.once('error', reject);
    });
}