import { Command } from '#khaf/Command';
import { Cartoonize } from '#khaf/utility/commands/Cartoonize';
import { type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Cartoonize an image using AI.',
                '[attached image]'
            ],
            {
                name: 'cartoonize',
                folder: 'Utility',
                args: [0, 0],
                aliases: ['cartoon'],
                guildOnly: true,
                ratelimit: 30
            }
        );
    }

    async init (message: Message): Promise<UnsafeEmbed> {
        if (message.attachments.size === 0)
            return this.Embed.error('No image was attached!');

        void message.channel.sendTyping();

        const cartoon = await Cartoonize.cartoonize(message.attachments.first()!);
        if (!cartoon)
            return this.Embed.error('Failed to extract the image from the HTML. 😕');

        return this.Embed
            .ok(`[Click Here](${cartoon}) to download!`)
            .setImage(cartoon);
    }
}
