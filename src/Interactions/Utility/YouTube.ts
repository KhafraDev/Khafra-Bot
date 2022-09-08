import { Interactions } from '#khaf/Interaction'
import { YouTube, type YouTubeSearchResults } from '#khaf/utility/commands/YouTube'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold, time } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import { ApplicationCommandOptionType, InteractionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import {
    InteractionCollector, type ButtonInteraction, type ChatInputCommandInteraction, type InteractionReplyOptions
} from 'discord.js'
import { randomUUID } from 'node:crypto'

function * format({ items }: YouTubeSearchResults): Generator<APIEmbed, void, unknown> {
    for (let i = 0; i < items.length; i++) {
        const video = items[i].snippet
        yield Embed.json({
            color: colors.ok,
            description: `${video.description.slice(0, 2048)}`,
            title: video.title,
            author: { name: video.channelTitle },
            thumbnail: { url: video.thumbnails.default.url },
            fields: [
                { name: bold('Published:'), value: time(new Date(video.publishTime)) },
                { name: bold('URL:'), value: `https://youtube.com/watch?v=${items[i].id.videoId}` }
            ]
        })
    }
}

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'youtube',
            description: 'Gets YouTube videos matching your search.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'search',
                    description: 'Videos to search for.',
                    required: true
                }
            ]
        }

        super(sc, { defer: true })
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const query = interaction.options.getString('search', true)
        const results = await YouTube(query)

        if ('error' in results) {
            return {
                content: `❌ ${results.error.code}: ${results.error.message}`,
                ephemeral: true
            }
        } else if (results.pageInfo.totalResults === 0 || results.items.length === 0) {
            return {
                content: '❌ No results found!',
                ephemeral: true
            }
        }

        const id = randomUUID()
        const embeds = [...format(results)]
        let page = 0

        const m = await interaction.editReply({
            embeds: [embeds[0]],
            components: [
                Components.actionRow([
                    Buttons.approve('Next', `next-${id}`),
                    Buttons.secondary('Previous', `back-${id}`),
                    Buttons.deny('Stop', `stop-${id}`)
                ])
            ]
        })

        const c = new InteractionCollector<ButtonInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: m,
            time: 120_000,
            idle: 60_000,
            filter: (i) =>
                i.user.id === interaction.user.id &&
                i.customId.endsWith(id)
        })

        for await (const [i] of c) {
            if (i.customId.startsWith('stop-') || c.total >= embeds.length) {
                c.stop()
                break
            }

            i.customId.startsWith('next-') ? page++ : page--

            if (page < 0) page = embeds.length - 1
            if (page >= embeds.length) page = 0

            await i.update({ embeds: [embeds[page]] })
        }

        if (c.collected.size !== 0) {
            const last = c.collected.last()

            if (last) {
                await last.update({ components: disableAll(m) })
            }
        }
    }
}