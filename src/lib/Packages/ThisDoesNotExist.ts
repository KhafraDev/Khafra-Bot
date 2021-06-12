import fetch from 'node-fetch';
import { MessageAttachment, ReplyMessageOptions } from 'discord.js';
import { Embed } from '../Utility/Constants/Embeds.js';

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
    const attach = new MessageAttachment(res.body, `t${type}dne.jpeg`);

    return {
        embeds: [
            Embed.success().setImage(`attachment://t${type}dne.jpeg`)
        ],
        files: [attach]
    } as ReplyMessageOptions;
}