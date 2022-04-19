import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import type { APIEmbed } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Have KhafraBot say something!',
                'Have a great day!', 'You suck.'
            ],
            {
                name: 'say',
                folder: 'Fun',
                aliases: ['speak', 'talk', 'tell'],
                args: [1],
                ratelimit: 3
            }
        );
    }

    async init (message: Message, { args }: Arguments): Promise<APIEmbed> {
        const embed = EmbedUtil.setAuthor(
            Embed.ok(),
            {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL()
            }
        );
        return EmbedUtil.setDescription(embed, args.join(' '));
    }
}