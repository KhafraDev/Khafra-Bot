import { fetch } from 'undici';
import { MessageAttachment, ReplyMessageOptions } from 'discord.js';
import { Embed } from '../Utility/Constants/Embeds.js';

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
    const attach = new MessageAttachment(await res.blob(), `t${type}dne.jpeg`)
        .setDescription(`A random${type === 'artwork' ? ' piece of' : ''} ${type}!`);

    return {
        embeds: [
            Embed.success().setImage(`attachment://t${type}dne.jpeg`)
        ],
        files: [attach],
        failIfNotExists: false
    } as ReplyMessageOptions;
}