import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get the bot\'s ping!'
            ],
			{
                name: 'ping',
                folder: 'Fun',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const m = await message.reply(this.Embed.success('Pinging...!'));
        
        const embed = this.Embed.success(`
        Pong! 🏓

        Bot: ${m.createdTimestamp - message.createdTimestamp} ms
        Heartbeat: ${m.client.ws.ping} ms
        `);

        return m.edit(embed);
    }
}