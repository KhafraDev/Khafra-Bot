import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { Cartoonize } from '../../lib/Packages/Cartoonize.js';

export class kCommand extends Command {
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
                ratelimit: 30,
                errors: {
                    'TypeError': 'Image wasn\'t found on page.',
                    'FetchError': 'A server issue occurred.'
                }
            }
        );
    }

    async init(message: Message) {
        if (message.attachments.size === 0)
            return this.Embed.generic(this, 'No image attached!');

        void message.channel.sendTyping();
        
        const cartoon = await Cartoonize.cartoonize(message.attachments.first()!);
        if (!cartoon)
            return this.Embed.fail('Failed to extract the image from the HTML. 😕');
        
        return this.Embed
            .success(`[Click Here](${cartoon}) to download!`)
            .setImage(cartoon);
    }
}
