import fetch from 'undici-fetch';
import { MessageAttachment, ReplyMessageOptions } from 'discord.js';
import { Embed } from '../Utility/Constants/Embeds.js';
import { Stream } from 'stream';

const formatURL = new Map<DNE, (type: DNE) => string>([
    ['artwork', t => `https://this${t}doesnotexist.com/`],
    ['cat',     t => `https://this${t}doesnotexist.com/`],
    ['horse',   t => `https://this${t}doesnotexist.com/`],
    ['person',  t => `https://this${t}doesnotexist.com/image`]
]);

type DNE = 
    | 'artwork' 
    | 'cat' 
    | 'horse'
    | 'person'

export const thisDoesNotExist = async (type: DNE) => {
    const url = formatURL.get(type)(type);

    const res = await fetch(url);
    const attach = new MessageAttachment(res.body.data as unknown as Stream, `t${type}dne.jpeg`);

    return {
        embeds: [
            Embed.success().setImage(`attachment://t${type}dne.jpeg`)
        ],
        files: [attach],
        failIfNotExists: false
    } as ReplyMessageOptions;
}