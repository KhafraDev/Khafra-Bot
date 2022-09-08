import { KhafraClient } from '#khaf/Bot'
import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { inlineCode } from '@discordjs/builders'
import type { Message } from 'discord.js'

export class kCommand extends Command {
    constructor () {
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
        )
    }

    async init (message: Message, argument: Arguments, settings: kGuild): ReturnType<Command['init']> {
        if (argument.args.length === 0) {
            // help message
            return Embed.error('not implemented yet')
        }

        const name = argument.args[0].toLowerCase()
        const commandName = name.startsWith('ticket:') || name.startsWith('tickets:')
            ? name
            : `ticket:${name}`

        if (!KhafraClient.Commands.has(commandName.toLowerCase())) {
            return Embed.error(
                `Ticket.${name} command doesn't exist, use ${inlineCode('ticket')} for more information!`
            )
        }

        const command = KhafraClient.Commands.get(commandName.toLowerCase())!

        return command.init(message, argument, settings)
    }
}