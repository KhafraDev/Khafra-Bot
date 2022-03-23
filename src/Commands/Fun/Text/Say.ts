import { Arguments, Command } from '#khaf/Command';
import { type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';

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

    async init (message: Message, { args }: Arguments): Promise<UnsafeEmbed> {
        return this.Embed.ok()
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(args.join(' '));
    }
}