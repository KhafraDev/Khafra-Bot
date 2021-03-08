import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'Get the link to invite the bot to another server.'
        ], {
            name: 'invite',
            folder: 'Bot',
            args: [0, 0],
            aliases: [ 'botinvite' ]
        });
    }

    init(message: Message) {
        return this.Embed.success(`
        **Basic Permissions:**
        Some commands will not work!
        https://discord.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot&permissions=117824

        **Everything:**
        https://discord.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot&permissions=1074654294
        `);
    }
}