import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Buffer } from 'buffer';
import { MessageAttachment, ReplyMessageOptions } from 'discord.js';
import { fetch } from 'undici';

const formatURL = new Map([
    ['artwork', `https://thisartworkdoesnotexist.com/`],
    ['cat',     `https://thiscatdoesnotexist.com/`],
    ['horse',   `https://thishorsedoesnotexist.com/`],
    ['person',  `https://thispersondoesnotexist.com/image`]
]);

export type DNE = 
    | 'artwork' 
    | 'cat' 
    | 'horse'
    | 'person'

export const thisDoesNotExist = async (type: DNE) => {
    const url = formatURL.get(type);
    if (!url) return null;

    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    const attach = new MessageAttachment(buffer, `t${type}dne.jpeg`)
        .setDescription(`A random${type === 'artwork' ? ' piece of' : ''} ${type}!`);

    return {
        embeds: [
            Embed.ok().setImage(`attachment://t${type}dne.jpeg`)
        ],
        files: [attach],
        failIfNotExists: false
    } as ReplyMessageOptions;
}