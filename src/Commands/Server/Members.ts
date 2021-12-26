import { bold } from '@khaf/builders';
import { Message } from 'discord.js';
import { Command } from '#khaf/Command';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get the number of members in a guild!'
            ],
			{
                name: 'members',
                folder: 'Server',
                args: [0, 0],
                guildOnly: true,
                ratelimit: 3,
                aliases: [ 'membercount' ]
            }
        );
    }

    async init(message: Message<true>) {
        return this.Embed.ok(`
        There are ${bold(message.guild.memberCount.toLocaleString())} members in ${message.guild.name}!
        `);
    }
}