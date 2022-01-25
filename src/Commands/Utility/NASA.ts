import { Command } from '#khaf/Command';
import { cache, NASAGetRandom } from '#khaf/utility/commands/NASA';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@khaf/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a random Astronomy Photo of the Day (APOD) supplied by NASA.'
            ],
			{
                name: 'apod',
                folder: 'Utility',
                args: [0, 0],
                aliases: [ 'nasa' ]
            }
        );
    }

    async init(message: Message) {
        if (cache.length === 0) {
            void message.channel.sendTyping();
        }
        
        const [err, result] = await dontThrow(NASAGetRandom());

        if (err !== null) {
            return this.Embed.error(`An unexpected error occurred: ${inlineCode(err.message)}`);
        } else if (result === null) {
            return this.Embed.error('No images were fetched, try again?');
        }

        const embed = this.Embed.ok()
            .setTitle(result.title)
            .setImage(result.link);
            
        if (typeof result.copyright === 'string') {
            embed.setFooter({ text: `© ${result.copyright}` });
        }

        return embed;
    }
}