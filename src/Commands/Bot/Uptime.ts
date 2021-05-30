import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

const getUptime = (ms: number) => {
    return Object.entries({
		d: Math.floor(ms / 86400000),
		h: Math.floor(ms / 3600000) % 24,
		m: Math.floor(ms / 60000) % 60,
		s: Math.floor(ms / 1000) % 60,
		ms: Math.floor(ms) % 1000,
    })
        .filter(f => f[1] > 0)
        .map(t => `${t[1]}${t[0]}`)
        .join(' ');
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get the bot\'s current uptime!'
            ],
            {
                name: 'uptime',
                folder: 'Bot',
                args: [0, 0],
                ratelimit: 3
            }
        );
    }

    async init(message: Message) {
        return this.Embed.success(`
        ⏰ \`\`${getUptime(message.client.uptime)}\`\`
        `).setTitle('Khafra-Bot has been online for:');
    }
}