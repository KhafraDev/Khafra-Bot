import { inlineCode } from '@discordjs/builders';
import { Message } from 'discord.js';
import { NASAGetRandom, cache } from '../../lib/Packages/NASA.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
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
            return this.Embed.fail(`An unexpected error occurred: ${inlineCode(err.message)}`);
        } else if (result === null) {
            return this.Embed.fail('No images were fetched, try again?');
        }

        const embed = this.Embed.success()
            .setTitle(result.title)
            .setImage(result.link);
            
        if (typeof result.copyright === 'string') {
            embed.setFooter(`© ${result.copyright}`);
        }

        return embed;
    }
}
