import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get the bot\'s ping!'
            ],
			{
                name: 'ping',
                folder: 'Bot',
                args: [0, 0],
                ratelimit: 7
            }
        );
    }

    async init(message: Message): Promise<void> {
        const m = await message.reply({ embeds: [this.Embed.ok('Pinging...!')] });
        
        const embed = this.Embed.ok(`
        Pong! 🏓

        Bot: ${m.createdTimestamp - message.createdTimestamp} ms
        Heartbeat: ${m.client.ws.ping} ms
        `);

        return void m.edit({ embeds: [embed] });
    }
}