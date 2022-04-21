import { Interactions } from '#khaf/Interaction';
import { YouTube, type YouTubeSearchResults } from '#khaf/utility/commands/YouTube';
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { bold, time } from '@discordjs/builders';
import type { APIEmbed} from 'discord-api-types/v10';
import { ApplicationCommandOptionType, InteractionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    InteractionCollector, type ChatInputCommandInteraction, type InteractionReplyOptions,
    type Message,
    type MessageComponentInteraction
} from 'discord.js';

function * format({ items }: YouTubeSearchResults): Generator<APIEmbed, void, unknown> {
    for (let i = 0; i < items.length; i++) {
        const video = items[i].snippet;
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
        });
    }
}

export class kInteraction extends Interactions {
    constructor() {
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
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const query = interaction.options.getString('search', true);
        const results = await YouTube(query);

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

        const embeds = [...format(results)];
        let page = 0;

        const m = await interaction.editReply({
            embeds: [embeds[0]],
            components: [
                Components.actionRow([
                    Buttons.approve('Next'),
                    Buttons.secondary('Previous'),
                    Buttons.deny('Stop')
                ])
            ]
        }) as Message;

        const c = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: m,
            time: 120_000,
            idle: 60_000,
            filter: (i) =>
                i.user.id === interaction.user.id
        });

        c.on('collect', i => {
            if (i.customId === 'deny' || c.total >= embeds.length) {
                return c.stop();
            }

            i.customId === 'approve' ? page++ : page--;

            if (page < 0) page = embeds.length - 1;
            if (page >= embeds.length) page = 0;

            return void dontThrow(i.update({
                embeds: [embeds[page]]
            }));
        });

        c.once('end', (c) => {
            if (c.size === 0) return; // user didn't use any buttons
            return void dontThrow(c.last()!.update({ components: disableAll(m) }))
        });
    }
}