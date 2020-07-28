import { Command } from '../../Structures/Command';
import Embed from '../../Structures/Embed';
import { Message } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            'say', 
            [
                'Have KhafraBot say something!',
                'Have a great day!', 'You suck.'
            ], 
            [ /* No extra perms needed */ ],
            5,
            [ 'speak', 'talk', 'tell' ]
        );
    }

    init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions))
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, this.help.slice(1)));
        }

        const embed = Embed.success()
            .setTimestamp()
            .setDescription(`
            ${message.member} says:
            \`\`${args.join(' ').slice(0, 1900)}\`\`
            `);

        return message.channel.send(embed);
    }
}