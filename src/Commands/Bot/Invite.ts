import { Command } from '#khaf/Command';
import { bold, type Embed } from '@khaf/builders';
import { Message } from 'discord.js';

const scope = `bot%20applications.commands`;

export class kCommand extends Command {
    constructor () {
        super([
            'Get the invite links for the bot! :)'
        ], {
            name: 'invite',
            folder: 'Bot',
            args: [0, 0],
            ratelimit: 3,
            aliases: [ 'botinvite' ]
        });
    }

    async init (message: Message): Promise<Embed> {
        const selfId = message.client.user!.id;

        return this.Embed.ok()
            .addField({
                name: bold('Basic Permissions:'), 
                value: `Not everything will work! \n[Click Here](https://discord.com/oauth2/authorize?client_id=${selfId}&scope=${scope}&permissions=117824)`
            })
            .addField({
                name: bold('Everything:'),
                value: `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${selfId}&permissions=1478811839735&scope=${scope})`
            })
            .addField({
                name: bold('Enable slash commands and buttons:'),
                value: `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${selfId}&permissions=0&scope=${scope})`
            });
    }
}