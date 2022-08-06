import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import { owlbotio } from '#khaf/utility/commands/OwlBotIO'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Define a word!',
                'credit card', 'cat', 'juice'
            ],
            {
                name: 'define',
                folder: 'Utility',
                args: [1],
                aliases: ['definition', 'dict', 'dictionary']
            }
        )
    }

    async init (_message: Message, { args }: Arguments): Promise<APIEmbed> {
        const word = await owlbotio(args.join(' '))

        if (word?.definitions == null) {
            return Embed.error('No definition found!')
        }

        return Embed.ok(`
        **${word.word}** ${word.pronunciation ? `(${word.pronunciation})` : ''}
        ${word.definitions
        .map(w => `*${w.type}* - ${w.definition}${w.emoji ? ` ${w.emoji}` : ''}`)
        .join('\n')
        .slice(0, 2048 - word.word.length - (word.pronunciation ? word.pronunciation.length + 2 : 0))
}
        `)
    }
}