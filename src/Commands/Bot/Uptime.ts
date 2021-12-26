import { inlineCode } from '@khaf/builders';
import { Message } from 'discord.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Command } from '#khaf/Command';

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
        return Embed.ok(`
        ⏰ ${inlineCode(getUptime(message.client.uptime ?? 0))}
        `).setTitle('Khafra-Bot has been online for:');
    }
}