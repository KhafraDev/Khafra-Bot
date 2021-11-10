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
                name: 'ticket',
                folder: 'Server',
                aliases: ['tickets'],
                args: [0],
                guildOnly: true
            }
        );
    }

    async init(message: Message, argument: Arguments, settings: kGuild) {
        if (argument.args.length === 0) {
            // help message
            return this.Embed.fail('not implemented yet');
        }

        const name = argument.args[0].toLowerCase();
        const commandName = name.startsWith('ticket:') || name.startsWith('tickets:')
            ? name
            : `ticket:${name}`;

        if (!KhafraClient.Commands.has(commandName.toLowerCase())) {
            return this.Embed.fail(
            `Ticket.${name} command doesn't exist, use ${inlineCode(`${settings.prefix}ticket`)} for more information!`
            );
        }

        const command = KhafraClient.Commands.get(commandName.toLowerCase())!;

        return command.init(message, argument, settings);
    }
}