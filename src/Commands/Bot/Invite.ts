import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

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
                '**Basic Permissions:**', 
                `Not everything will work! \n[Click Here](https://discord.com/oauth2/authorize?client_id=${selfId}&scope=bot&permissions=117824)`
            )
            .addField(
                '**Everything:**',
                `[Click Here](https://discord.com/oauth2/authorize?client_id=${selfId}&scope=bot&permissions=1074654294)`
            )
            .addField(
                '**Enable slash commands and buttons:**',
                `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${selfId}&permissions=0&scope=applications.commands%20bot)`
            );
    }
}