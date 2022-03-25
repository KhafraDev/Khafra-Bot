import { Command } from '#khaf/Command';
import { cache, NASAGetRandom } from '#khaf/utility/commands/NASA';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode, type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get a random Astronomy Photo of the Day (APOD) supplied by NASA.'
            ],
            {
                name: 'apod',
                folder: 'Utility',
                args: [0, 0],
                aliases: ['nasa']
            }
        );
    }

    async init (message: Message): Promise<UnsafeEmbed> {
        if (cache.length === 0) {
            void message.channel.sendTyping();
        }

        const [err, result] = await dontThrow(NASAGetRandom());

        if (err !== null) {
            return Embed.error(`An unexpected error occurred: ${inlineCode(err.message)}`);
        } else if (result === null) {
            return Embed.error('No images were fetched, try again?');
        }

        const embed = Embed.ok()
            .setTitle(result.title)
            .setImage(result.link);

        if (typeof result.copyright === 'string') {
            embed.setFooter({ text: `© ${result.copyright}` });
        }

        return embed;
    }
}