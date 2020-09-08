import { Command } from '../../Structures/Command';
import Embed from '../../Structures/Embed';
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
        if(args.length < 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const embed = Embed.success()
            .setTimestamp()
            .setDescription(`
            ${message.author} says:
            \`\`${args.join(' ').slice(0, 1900)}\`\`
            `);

        return message.channel.send(embed);
    }
}