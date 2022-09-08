import { KhafraClient } from '#khaf/Bot'
import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold } from '@discordjs/builders'
import type { RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

const makeTree = (data: RESTPostAPIChatInputApplicationCommandsJSONBody, indent = 1, trim = true): string => {
    if (data.options === undefined || data.options.length === 0) {
        return ''
    }

    let tree = '\n'

    for (const option of data.options) {
        const start = '　'.repeat(indent * 2)

        tree += `${start}• ${option.name} - ${option.description}\n`

        if ('options' in option && option.options) {
            tree = tree.trimEnd()
            tree += makeTree(option as unknown as Parameters<typeof makeTree>[0], indent + 1, false)
        }
    }

    return trim ? tree.trimEnd() : tree
}

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'help',
            description: 'Get help with a command.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'command',
                    description: 'The name of the command.',
                    required: true,
                    autocomplete: true
                }
            ]
        }

        super(sc)
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const commandName = interaction.options.getString('command', true).toString()

        if (!KhafraClient.Interactions.Commands.has(commandName)) {
            return {
                content: '❌ That command couldn\'t be found.',
                ephemeral: true
            }
        }

        const command = KhafraClient.Interactions.Commands.get(commandName)!
        const data = command.data as RESTPostAPIChatInputApplicationCommandsJSONBody
        const embed = Embed.json({
            color: colors.ok,
            description: `${bold(data.name)} - ${data.description}${makeTree(data)}`
        })

        return {
            embeds: [embed]
        }
    }
}