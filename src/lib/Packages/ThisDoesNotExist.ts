import fetch from 'node-fetch';
import { MessageAttachment } from 'discord.js';
import { Embed } from '../Utility/Constants/Embeds.js';

type DNE = 
    | 'artwork' 
    | 'cat' 
    | 'horse'
    | 'person'

export const thisDoesNotExist = async (type: DNE) => {
    const url = `https://this${type}doesnotexist.com/${type === 'person' ? 'image' : ''}`;

    const res = await fetch(url);
    const attach = new MessageAttachment(res.body, `t${type}dne.jpeg`);
    return Embed.success()
        .attachFiles([ attach ])
        .setImage(`attachment://t${type}dne.jpeg`);
}