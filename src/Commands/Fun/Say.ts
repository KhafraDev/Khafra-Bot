import Command from '../../Structures/Command';
import { Message } from 'discord.js';

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
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            `));
        }

        return message.channel.send(args.join(' '));
    }
}