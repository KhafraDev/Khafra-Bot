import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';
import { changeRooms } from '../../lib/Backend/Kongregate.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Change the Chatroom the Kongregate Relay is currently in.',
                '3', '2', '1'
            ], 
            [ /* No extra perms needed */ ],
            {
                name: 'kongroom',
                folder: 'Fun',
                args: [1, 1],
                ownerOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!isValidNumber(+args[0])) {
            return message.channel.send(this.Embed.generic());
        }

        changeRooms(+args[0]);
        return message.channel.send(this.Embed.success(`
        Relay bot is now in chatroom #${args[0]}!
        `));
    }
}