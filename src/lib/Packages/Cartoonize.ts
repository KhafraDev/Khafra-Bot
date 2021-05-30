import FormData from '@discordjs/form-data';
import { MessageAttachment } from 'discord.js';
import { decodeXML } from 'entities';
import { lookup } from 'mime-types';
import fetch from 'node-fetch';

/*** Get the image from the html */
const R = /<div class="image">\s+<img src="(.*?)">/;

/**
 * Cartoonize an image using AI from an "unofficial API".
 * Involves HTML scraping.
 * @throws {TypeError | AssertionError | FetchError}
 */
export const cartoonize = async (attachment: MessageAttachment) => {
    const mime = lookup(attachment.name) + '';

    const res = await fetch(attachment.proxyURL);
    if (!res.ok)    
        return null;

    const form = new FormData();
    form.append('image', res.body, {
        filename: attachment.name,
        contentType: mime
    });

    const cartoonizeRes = await fetch('https://cartoonize-lkqov62dia-de.a.run.app/cartoonize', {
        method: 'POST',
        headers: form.getHeaders(),
        body: form
    });

    if (!cartoonizeRes.ok)
        return null;

    const html = await cartoonizeRes.text();
    const image = decodeXML(html.match(R)[1]);

    return image;
}