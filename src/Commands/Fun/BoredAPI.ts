import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { promisify } from 'util';
import { randomInt } from 'crypto';
import activities from '../../../assets/boredapi.json';

// https://github.com/drewthoennes/Bored-API/blob/master/db/activities.json

const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);

export default class extends Command {
    constructor() {
        super(
            [
                'Get a random activity to do when you\'re bored.',
                ''
            ], 
            {
                name: 'bored',
                folder: 'Fun',
                aliases: [ 'activity', 'activities' ],
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const activity = activities[await rand(activities.length)];
        return message.reply(this.Embed.success(`
        \`\`${activity.activity}\`\`
        ${activity.link ? `Learn about it [here](${activity.link})` : ''}
        Requires ${activity.participants} ${activity.participants === 1 ? 'person' : 'people'}!
        `));
    }
}