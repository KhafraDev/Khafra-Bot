import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Have KhafraBot say something!',
                'Have a great day!', 'You suck.'
            ], 
            [ /* No extra perms needed */ ],
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
            .setTimestamp()
            .setDescription(`
            ${message.author} says:
            \`\`${args.join(' ').slice(0, 1900)}\`\`
            `);

        return message.reply(embed);
    }
}