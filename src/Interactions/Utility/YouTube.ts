import { Interactions } from '#khaf/Interaction';
import { YouTube, YouTubeSearchResults } from '#khaf/utility/commands/YouTube';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ActionRow, bold, MessageActionRowComponent, time, type UnsafeEmbed as MessageEmbed } from '@discordjs/builders';
import { ApplicationCommandOptionType, InteractionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionCollector, Message, MessageComponentInteraction } from 'discord.js';

function * format(items: YouTubeSearchResults): Generator<MessageEmbed, void, unknown> {
    for (let i = 0; i < items.items.length; i++) {
        const video = items.items[i].snippet;
        const embed = Embed.ok()
            .setTitle(video.title)
            .setAuthor({ name: video.channelTitle })
            .setThumbnail(video.thumbnails.default.url)
            .setDescription(`${video.description.slice(0, 2048)}`)
            .addFields(
                { name: bold('Published:'), value: time(new Date(video.publishTime)) },
                { name: bold('URL:'), value: `https://youtube.com/watch?v=${items.items[i].id.videoId}` }
            );

        yield embed;
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

    async init(interaction: ChatInputCommandInteraction): Promise<string | undefined> {
        const query = interaction.options.getString('search', true);
        const results = await YouTube(query);

        if ('error' in results) {
            return `❌ ${results.error.code}: ${results.error.message}`;
        } else if (results.pageInfo.totalResults === 0 || results.items.length === 0) {
            return '❌ No results found!';
        }

        const embeds = [...format(results)];
        let page = 0;

        const m = await interaction.editReply({
            embeds: [embeds[0]],
            components: [
                new ActionRow<MessageActionRowComponent>().addComponents(
                    Components.approve('Next'),
                    Components.secondary('Previous'),
                    Components.deny('Stop')
                )
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
            return void dontThrow(c.last()!.update({ components: disableAll(m) }))
        });
    }
}