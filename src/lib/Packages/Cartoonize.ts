import type { MessageAttachment } from 'discord.js';
import { decodeXML } from 'entities';
import { basename } from 'path';
import { fetch, FormData } from 'undici';
import { dontThrow } from '../Utility/Don\'tThrow.js';
import { URLFactory } from '../Utility/Valid/URL.js';

/*** Get the image from the html */
const R = /<div class="image">\s+<img src="(.*?)">/;

/**
 * Cartoonize an image using AI from an unofficial API.
 */
export class Cartoonize {
    static async blobFromUrl(url: string) {
        const u = URLFactory(url)!;
        if (u === null) return null;
        
        const [err, res] = await dontThrow(fetch(u));
        if (err === null) return await res.blob();

        return null;
    }

    static async cartoonize(attachment: MessageAttachment) {
        const form = new FormData();
        const blob = await Cartoonize.blobFromUrl(attachment.proxyURL);
        
        if (blob === null) return null;
        form.append('image', blob, basename(attachment.proxyURL));

        const r = await fetch('https://cartoonize-lkqov62dia-de.a.run.app/cartoonize', {
            method: 'POST',
            body: form
        });

        const j = await r.text();
        const url = R.exec(j)![1];

        return decodeXML(url);
    }
}