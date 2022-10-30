import { ApplicationCommandOptionType, InteractionResponseType, MessageFlags } from 'discord-api-types/v10'
import type { InteractionCommand } from '../../types'
import { getOption, time } from '../../lib/util.js'
import { npm } from '../../lib/npm.js'
import { colors } from '../../lib/constants.js'

export const command: InteractionCommand = {
    data: {
        name: 'npm',
        description: 'Search on npm!',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'search',
                description: 'Package to search for.',
                required: true
            }
        ]
    },

    async run (interaction) {
        const search = getOption<string>(interaction.data, 'search')!
        const result = await npm(search.value)

        if ('code' in result) {
            return {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: 'No package with that name was found.',
                    flags: MessageFlags.Ephemeral
                }
            }
        } else if ('error' in result) {
            return {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `An unexpected error occurred: ${result.error}`,
                    flags: MessageFlags.Ephemeral
                }
            }
        }

        const dist = result.versions[result['dist-tags']['latest']]

        const maintainers = dist.maintainers
            .slice(0, 10)
            .map(u => u.name)
            .join(', ')

        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                embeds: [
                    {
                        color: colors.ok,
                        author: {
                            name: `NPM - https://npmjs.com/package/${dist.name}`,
                            icon_url: 'https://avatars0.githubusercontent.com/u/6078720?v=3&s=400',
                            url: `https://npmjs.com/package/${dist.name}`
                        },
                        description: result.description.slice(0, 4096),
                        fields: [
                            { name: 'Version:', value: dist.version, inline: true },
                            { name: 'License:', value: dist.license, inline: true },
                            { name: 'Author:', value: result.author?.name ?? 'N/A', inline: true },
                            {
                                name: 'Last Modified:',
                                value: time(new Date(result.time?.modified ?? Date.now()), 'f'),
                                inline: true
                            },
                            {
                                name: 'Published:',
                                value: time(new Date(result.time?.created ?? Date.now()), 'f'),
                                inline: true
                            },
                            { name: 'Homepage:', value: result.homepage ?? 'None', inline: true },
                            { name: 'Maintainers:', value: maintainers }
                        ]
                    }
                ]
            }
        }
    }
}
