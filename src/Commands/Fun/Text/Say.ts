import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbedBuilder } from '@discordjs/builders';
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

    async init (message: Message, { args }: Arguments): Promise<UnsafeEmbedBuilder> {
        return Embed.ok()
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(args.join(' '));
    }
}