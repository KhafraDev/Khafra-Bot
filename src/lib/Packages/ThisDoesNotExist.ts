import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { MessageAttachment, type ReplyMessageOptions } from 'discord.js';
import { Buffer } from 'node:buffer';
import { request } from 'undici';

const formatURL = new Map<DNE, string>([
    ['artwork', 'https://thisartworkdoesnotexist.com/'],
    ['cat',     'https://thiscatdoesnotexist.com/'],
    ['horse',   'https://thishorsedoesnotexist.com/'],
    ['person',  'https://thispersondoesnotexist.com/image']
]);

export type DNE =
    | 'artwork'
    | 'cat'
    | 'horse'
    | 'person'

export const thisDoesNotExist = async (type: DNE): Promise<ReplyMessageOptions | null> => {
    const url = formatURL.get(type);
    if (!url) return null;

    const { body } = await request(url);
    const buffer = Buffer.from(await body.arrayBuffer());
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