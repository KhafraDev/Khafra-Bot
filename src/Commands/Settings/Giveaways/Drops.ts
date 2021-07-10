import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Drop giveaway: first person to react to a message wins the prize.'
            ],
			{
                name: 'giveaway:drop',
                folder: 'Giveaways',
                aliases: ['giveaways:drop'],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        message;
    }
}