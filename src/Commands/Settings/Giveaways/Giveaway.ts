import { Arguments, Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { KhafraClient } from '../../../Bot/KhafraBot.js';
import { inlineCode } from '@khaf/builders';
import { kGuild } from '../../../lib/types/KhafraBot.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Giveaways: main place to create a type of giveaway.'
            ],
			{
                name: 'giveaway',
                folder: 'Giveaways',
                aliases: ['giveaways'],
                args: [0],
                guildOnly: true
            }
        );
    }

    async init(message: Message, argument: Arguments, settings: kGuild) {
        const { args } = argument;

        if (args.length === 0) {
            // help message
            return this.Embed.fail('not implemented yet');
        }

        const name = args[0].toLowerCase();
        const commandName = name.startsWith('giveaway:') || name.startsWith('giveaways:')
            ? name
            : `giveaway:${name}`;

        if (!KhafraClient.Commands.has(commandName.toLowerCase())) {
            return this.Embed.fail(
            `Giveaway command doesn't exist, use ${inlineCode(`${settings.prefix}giveaway`)} for more information!`
            );
        }

        const command = KhafraClient.Commands.get(commandName.toLowerCase())!;

        return command.init(message, argument, settings);
    }
}