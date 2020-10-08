import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import crypto from 'crypto';

export default class extends Command {
    constructor() {
        super(
            [
                'Generate a random number avoiding modulo bias!',
                '100 250', '500'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'randomnum',
                aliases: ['randnum', 'randomint', 'randint'],
                folder: 'Fun',
                args: [1, 2]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!('randomInt' in crypto)) {
            return message.channel.send(this.Embed.fail(`
            The \`\`node\`\` version the bot is running on is too old!
            `));
        }

        const [minStr, maxStr] = args.length === 2 ? args : ['0', ...args];
        const max = +maxStr + 1;
        const min = +minStr;

        if(
            max - min > 281474976710655 || // difference set by function; difference can't be greater than this
            min < 0 || max < 0 ||          // negative numbers aren't allowed
            min === max ||                 // no range
            max < min ||                   // min is greater than max
            !Number.isSafeInteger(min) || !Number.isSafeInteger(max)
        ) {
            return message.channel.send(this.Embed.generic(
                'Invalid number(s) provided! Numbers ``cannot equal`` one another ' + 
                'and the difference between the two ``cannot be greater`` than 281,474,976,710,655!'
            ));
        }

        crypto.randomInt(min, max, (err, num) => {
            if(err) {
                return message.channel.send(this.Embed.fail(err.toString()));
            }

            return message.channel.send(this.Embed.success(`
            Your number is \`\`${num}\`\`!
            `));
        });
    }
}