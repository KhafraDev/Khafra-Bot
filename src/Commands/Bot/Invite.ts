import { bold } from '@discordjs/builders';
import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

const scope = `bot%20applications.commands`;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
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

    init(message: Message) {
        const selfId = message.client.user!.id;

        return this.Embed.success()
            .addField(
                bold('Basic Permissions:'), 
                `Not everything will work! \n[Click Here](https://discord.com/oauth2/authorize?client_id=${selfId}&scope=${scope}&permissions=117824)`
            )
            .addField(
                bold('Everything:'),
                `[Click Here](https://discord.com/oauth2/authorize?client_id=${selfId}&scope=${scope}&permissions=1074654294)`
            )
            .addField(
                bold('Enable slash commands and buttons:'),
                `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${selfId}&permissions=0&scope=${scope})`
            );
    }
}