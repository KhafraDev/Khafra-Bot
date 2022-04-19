import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { bold } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

const scope = 'bot%20applications.commands';

export class kCommand extends Command {
    constructor () {
        super([
            'Get the invite links for the bot! :)'
        ], {
            name: 'invite',
            folder: 'Bot',
            args: [0, 0],
            ratelimit: 3,
            aliases: ['botinvite']
        });
    }

    async init (message: Message): Promise<APIEmbed> {
        const selfId = message.client.user!.id;

        return EmbedUtil.addFields(
            Embed.ok(),
            {
                name: bold('Basic Permissions:'),
                value: `Not everything will work! \n[Click Here](https://discord.com/oauth2/authorize?client_id=${selfId}&scope=${scope}&permissions=117824)`
            },
            {
                name: bold('Everything:'),
                value: `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${selfId}&permissions=1478811839735&scope=${scope})`
            },
            {
                name: bold('Enable slash commands and buttons:'),
                value: `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${selfId}&permissions=0&scope=${scope})`
            }
        );
    }
}