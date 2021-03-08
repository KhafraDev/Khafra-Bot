import { Message, MessageReaction, User } from 'discord.js';
import { rand } from '../../../lib/Utility/Constants/OneLiners.js';
import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const emojis = ['🪨', '🧻', '✂️'];

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'Play a game of rock paper scissors against the bot!',
        ], {
            name: 'rockpaperscissors',
            folder: 'Games',
            args: [0, 0],
            aliases: ['rps']
        });
    }

    async init(message: Message) {
        const reacted = await Promise.allSettled(emojis.map(e => message.react(e)));
        
        if (!reacted.every(p => p.status === 'fulfilled')) {
            return this.Embed.fail('I couldn\'t react to the message completely! 😕');
        }

        const botChoice = emojis[await rand(emojis.length)];

        const f = (r: MessageReaction, u: User) =>
            emojis.includes(r.emoji.name) &&
            u.id === message.author.id;

        const c = await message.awaitReactions(f, { max: 1, time: 20000 });
        if (c.size === 0)
            return this.Embed.fail(`You didn't choose your turn within 20 seconds!`);

        const userChoice = c.first().emoji.name;

        if (userChoice === botChoice)
            return this.Embed.success(`It's a tie! ${botChoice}`);
        
        if (
            (userChoice === '🪨' && botChoice === '✂️') || // rock beats scissors
            (userChoice === '🧻' && botChoice === '🪨') || // paper beats rock
            (userChoice === '✂️' && botChoice === '🧻')   // scissors beats paper
        )   
            return this.Embed.success(`You win with ${userChoice}, I chose ${botChoice}! 😁`);

        return this.Embed.fail(`You lost! I chose ${botChoice}.`);
    }
}