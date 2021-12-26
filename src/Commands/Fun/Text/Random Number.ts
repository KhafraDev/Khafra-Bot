import { Command, Arguments } from '#khaf/Command';
import { Message } from 'discord.js';
import crypto from 'crypto';
import { rand } from '#khaf/utility/Constants/OneLiners.js';
import { inlineCode } from '@khaf/builders';

const MAX_DIFF = 2 ** 48 - 1;

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Generate a random number avoiding modulo bias!',
                '100 250', '500'
            ],
			{
                name: 'randomnum',
                aliases: ['randnum', 'randomint', 'randint'],
                folder: 'Fun',
                args: [1, 2],
                ratelimit: 5
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        if (!('randomInt' in crypto)) {
            return this.Embed.error(`
            The ${inlineCode('node')} version the bot is running on is too old!
            `);
        }

        const [minStr, maxStr] = args.length === 2 ? args : ['0', ...args];
        const max = +maxStr + 1;
        const min = +minStr;

        if (
            max - min > MAX_DIFF ||        // difference set by function; difference can't be greater than this
            min < 0 || max < 0 ||          // negative numbers aren't allowed
            min === max ||                 // no range
            max < min ||                   // min is greater than max
            !Number.isSafeInteger(min) || !Number.isSafeInteger(max)
        ) {
            return this.Embed.generic(
                this,
                'Invalid number(s) provided! Numbers ``cannot equal`` one another ' + 
                'and the difference between the two ``cannot be greater`` than 281,474,976,710,655 (2^48-1)!'
            );
        }

        const num = await rand(min, max);
       
        return this.Embed.ok(`
        Your number is ${inlineCode(`${num}`)}!
        `);
    }
}