import Command from '../../Structures/Command';
import Embed from '../../Structures/Embed';
import { Message, MessageEmbed } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            'say', 
            'Have KhafraBot say something!', 
            [ 'SEND_MESSAGES' ],
            [ 'speak', 'talk', 'tell' ]
        );
    }

    init(message: Message, args: string[]): Promise<Message> {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions))
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, [
                'Hello!', 'Goodbye!'
            ]))
        }

        return message.channel.send(this.formatEmbed(message, args))
    }

    formatEmbed(message: Message, args: string[]): MessageEmbed {
        const embed = Embed.success()
            .setTimestamp()
            .setDescription(`
            ${message.member} says:
            \`\`${args.join(' ').slice(0, 1900)}\`\`
            `);

        return embed;
    }
}