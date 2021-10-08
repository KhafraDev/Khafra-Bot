import { bold } from '@discordjs/builders';
import { Message } from '../../lib/types/Discord.js.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
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

    init(message: Message) {
        return this.Embed.success(`
        There are ${bold(message.guild.memberCount.toLocaleString())} members in ${message.guild.name}!
        `);
    }
}