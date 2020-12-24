import fetch from 'node-fetch';
import { MessageAttachment } from 'discord.js';
import { Command } from '../../Structures/Command.js';

type DNE = 
    | 'artwork' 
    | 'cat' 
    | 'horse'
    | 'person'

export const thisDoesNotExist = async (
    type: DNE
) => {
    const url = `https://this${type}doesnotexist.com/${type === 'person' ? 'image' : ''}`;
    try {
        const res = await fetch(url);
        const attach = new MessageAttachment(res.body, `t${type}dne.jpeg`);
        return Command.Embed.success()
            .attachFiles([ attach ])
            .setImage(`attachment://t${type}dne.jpeg`);
    } catch(e) {
        if(e.name === 'FetchError') {
            return Command.Embed.fail('Server failed to process the request!');
        }
        
        return Command.Embed.fail('An unexpected error occurred!');
    }
}