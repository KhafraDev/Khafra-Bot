import Command from '../../Structures/Command';
import Embed from '../../Structures/Embed';
import { Message } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            'say', 
            'Have KhafraBot say something!', 
            [ /* No extra perms needed */ ],
            [ 'speak', 'talk', 'tell' ]
        );
    }

    init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions))
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, [
                'Hello!', 'Goodbye!'
            ]));
        }

        return message.channel.send(this.formatEmbed(message, args));
    }

    formatEmbed(message: Message, args: string[]) {
        const embed = Embed.success()
            .setTimestamp()
            .setDescription(`
            ${message.member} says:
            \`\`${args.join(' ').slice(0, 1900)}\`\`
            `);

        return embed;
    }
}