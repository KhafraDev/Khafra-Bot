import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Have KhafraBot say something!',
                'Have a great day!', 'You suck.'
            ], 
            {
                name: 'say',
                folder: 'Fun',
                aliases: [ 'speak', 'talk', 'tell' ],
                args: [1]
            }
        );
    }

    init(message: Message, args: string[]) {
        const embed = this.Embed.success()
            .setAuthor(message.author.username, message.author.displayAvatarURL())
            .setDescription(args.join(' '));

        return message.reply(embed);
    }
}