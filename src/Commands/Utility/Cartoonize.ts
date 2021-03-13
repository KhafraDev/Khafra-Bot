import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { cartoonize } from '../../lib/Backend/Cartoonize.js';
import { cooldown } from '../../Structures/Cooldown/CommandCooldown.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    cooldown = cooldown(1, 30000);

    constructor() {
        super(
            [
                'Cartoonize an image using AI.',
                '[attached image]'
            ],
			{
                name: 'cartoonize',
                folder: 'Utility',
                args: [0, 0],
                aliases: [ 'cartoon' ],
                guildOnly: true,
                errors: {
                    'TypeError': 'Image wasn\'t found on page.',
                    'AssertionError': 'Request failed!'
                }
            }
        );
    }

    async init(message: Message) {
        if (message.attachments.size === 0) {
            return this.Embed.generic(this, 'No image attached!');
        } else if (!this.cooldown(message.guild.id) || !this.cooldown(message.author.id)) {
            return this.Embed.fail('Command is rate-limited once per 30 seconds per user and guild.');
        }
        
        const cartoon = await cartoonize(message.attachments.first());
        
        return this.Embed
            .success(`[Click Here](${cartoon}) to download!`)
            .setImage(cartoon);
    }
}
