import { Interactions } from '#khaf/Interaction';
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import {
    ActivityType, ApplicationCommandOptionType, InteractionType, type APIEmbed, type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10';
import { GuildMember, InteractionCollector, type ButtonInteraction, type ChatInputCommandInteraction, type InteractionReplyOptions } from 'discord.js';
import { randomUUID } from 'node:crypto';
import { request } from 'undici';

interface SomeRandomApiLyrics {
    title: string
    author: string
    lyrics: string
    thumbnail: Record<'genius', string>
    links: Record<'genius', string>
    disclaimer: string
}

const paginateText = (text: string, max: number): string[] => {
    const pages: string[] = [];

    for (let i = 0; i < text.length; i += max) {
        pages.push(text.slice(i, i + max));
    }

    return pages;
}

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'lyrics',
            description: 'Get lyrics to a song! Defaults to your currently playing song.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'song',
                    description: 'The name of the song to get the lyrics for. Put the band\'s name for better results!'
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
        let search = interaction.options.getString('song');

        if (typeof search !== 'string') {
            if (interaction.member === null || !(interaction.member instanceof GuildMember)) {
                return {
                    content: '❌ Can\'t read your presence. Search for the song instead!',
                    ephemeral: true
                }
            } else if (interaction.member.presence === null) {
                return {
                    content: '❌ You aren\'t listening to a song. Search for the song instead!',
                    ephemeral: true
                }
            }

            const listening = interaction.member.presence.activities.find(
                (activity) => activity.type === ActivityType.Listening && activity.name === 'Spotify'
            );

            if (listening === undefined) {
                return {
                    content: '❌ You aren\'t listening to a song. Search for the song instead!',
                    ephemeral: true
                }
            }

            search = `${listening.details} - ${listening.state}`; // band - song name
        }

        if (search.trim().length === 0) {
            return {
                content: '❌ Must provide a song name.',
                ephemeral: true
            }
        }

        await interaction.deferReply();

        // TODO: pull lyrics from somewhere else.
        const { body, statusCode } = await request(
            `https://some-random-api.ml/lyrics?title=${encodeURIComponent(search)}`
        );

        if (statusCode !== 200) {
            return {
                content: '❌ Lyrics for that song could not be found.',
                ephemeral: true
            }
        }

        const lyrics = await body.json().catch(() => null) as SomeRandomApiLyrics | null;

        if (lyrics === null) {
            return {
                content: '❌ An error occurred reading the lyrics.',
                ephemeral: true
            }
        }

        const basicEmbed = (): APIEmbed => Embed.json({
            color: colors.ok,
            title: `${lyrics.author} - ${lyrics.title}`,
            description: lyrics.lyrics,
            thumbnail: {
                url: lyrics.thumbnail.genius
            }
        });

        if (lyrics.lyrics.length <= 2048) {
            return {
                embeds: [basicEmbed()]
            }
        }

        let currentPage = 0;
        const id = randomUUID();
        const pages = paginateText(lyrics.lyrics, 2048).map((page) => {
            const embed = basicEmbed();
            embed.description = page;
            return embed;
        });

        const int = await interaction.editReply({
            embeds: [pages[currentPage]],
            components: [
                Components.actionRow([
                    Buttons.approve('Next', `next-${id}`),
                    Buttons.secondary('Previous', `back-${id}`),
                    Buttons.deny('Stop', `stop-${id}`)
                ])
            ]
        });

        const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            idle: 30_000,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.interaction?.id === i.message.interaction?.id &&
                i.customId.endsWith(id)
        });

        for await (const [collected] of collector) {
            const [action] = collected.customId.split('-');

            if (action === 'stop') break;

            action === 'next' ? currentPage++ : currentPage--;
            if (currentPage < 0) currentPage = pages.length - 1;
            if (currentPage >= pages.length) currentPage = 0;

            await collected.update({
                embeds: [pages[currentPage]],
                components: int.components
            });
        }

        const last = collector.collected.last();

        if (
            collector.collected.size !== 0 &&
            last?.replied === false
        ) {
            return void await last.update({
                components: disableAll(int)
            });
        }

        return void await interaction.editReply({
            components: disableAll(int)
        });
    }
}