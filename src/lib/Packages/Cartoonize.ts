import FormData from '@discordjs/form-data';
import { MessageAttachment } from 'discord.js';
import { decodeXML } from 'entities';
import { request, Agent } from 'https';
import { lookup } from 'mime-types';
import fetch from 'undici-fetch';
import { URL } from 'url';

/*** Get the image from the html */
const R = /<div class="image">\s+<img src="(.*?)">/;
const agent = new Agent({ keepAlive: true });

/**
 * Cartoonize an image using AI from an "unofficial API".
 * Involves HTML scraping.
 */
export const cartoonize = async (attachment: MessageAttachment) => {
    const f = new FormData();
    const a = new AbortController();
    const r = await fetch(attachment.proxyURL);
    const m = `${lookup(attachment.name)}`;
    
    setTimeout(() => a.abort(), 60000).unref();
    f.append('image', await r.arrayBuffer(), {
        filename: attachment.name,
        contentType: m
    });

    return new Promise<string>((done, reject) => {
        const req = request(new URL('https://cartoonize-lkqov62dia-de.a.run.app/cartoonize'), {
            method: 'POST',
            headers: f.getHeaders(),
            agent,
            abort: a.signal
        }, async (res) => {
            let data = '';
            
            for await (const chunk of res) {
                data += `${chunk}`;
            }

            return done(decodeXML(R.exec(data)[1]));
        });
        
        f.pipe(req);
        
        req.end();
        req.once('error', reject);
        req.once('abort', reject);
    });
}