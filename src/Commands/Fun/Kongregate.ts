import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';

let changeRooms: (num?: number) => void;
if(process.env.__KONG_USERNAME && process.env.__KONG_PASSWORD) {
    ({ changeRooms } = await import('../../lib/Backend/Kongregate.js'));
}

export default class extends Command {
    constructor() {
        super(
            [
                'Change the Chatroom the Kongregate Relay is currently in.',
                '3', '2', '1'
            ], 
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
            return message.reply(this.Embed.generic());
        } else if(!changeRooms) {
            return message.reply(this.Embed.fail('Function wasn\'t imported.'));
        }

        changeRooms(+args[0]);
        return message.reply(this.Embed.success(`
        Relay bot is now in chatroom #${args[0]}!
        `));
    }
}