import { rest } from '#khaf/Bot';
import { Interactions } from '#khaf/Interaction';
import { chunkSafe } from '#khaf/utility/Array.js';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import type { MessageActionRowComponentBuilder } from '@discordjs/builders';
import { ActionRowBuilder, inlineCode } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType, InteractionType, Routes } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions, MessageComponentInteraction } from 'discord.js';
import { InteractionCollector } from 'discord.js';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import { parse } from 'twemoji-parser';
import { request } from 'undici';

const Subcommands = {
    LIST: 'list',
    MIX: 'mix'
} as const;

const SubcommandOptions = {
    LIST: 'list',
    FIRST: 'first',
    SECOND: 'second'
} as const;

interface EmojiKitchen {
    locale: string
    results: {
        id: string
        title: string
        media_formats: {
            [key: string]: {
                url: string
                duration: number
                preview: string
                dims: number[]
                size: number
            }
        }
        created: number
        content_description: string
        h1_title: string
        itemurl: string
        url: string
        tags: string[]
        flags: string[]
        hasaudio: boolean
    }[]
    next: string
}

const supportedListURL = 'https://raw.githubusercontent.com/UCYT5040/Google-Sticker-Mashup-Research/main/emojis.txt';
const list: string[] = [];

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'emojimix',
            description: 'Mix two emojis together!',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: Subcommands.MIX,
                    description: 'Mix two emojis!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: SubcommandOptions.FIRST,
                            description: 'First emoji to mix.',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: SubcommandOptions.SECOND,
                            description: 'Second emoji to mix.',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: Subcommands.LIST,
                    description: 'List the emojis currently supported'
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
        const subcommand = interaction.options.getSubcommand(true);

        if (subcommand === Subcommands.LIST) {
            if (list.length === 0) {
                const [err, res] = await dontThrow(request(supportedListURL));

                if (err !== null) {
                    return {
                        content: `❌ An unexpected error occurred: ${inlineCode(err.message)}`,
                        ephemeral: true
                    }
                }

                const listJoined = await res.body.text();
                const emojis = parse(listJoined);

                list.push(...emojis.map(e => e.text));
            }

            let page = 0;
            const uuid = randomUUID();
            const pages = chunkSafe(list, 195).map(
                items => Embed.ok(items.join(' '))
            );

            const i = await interaction.reply({
                embeds: [pages[page]],
                components: [
                    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                        Components.approve('Next', `${uuid}-next`),
                        Components.primary('Back', `${uuid}-prev`),
                        Components.deny('Stop', `${uuid}-trash`)
                    )
                ],
                fetchReply: true
            });

            const collector = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
                interactionType: InteractionType.MessageComponent,
                message: i,
                idle: 30_000,
                filter: (i) =>
                    i.user.id === interaction.user.id &&
                    i.customId === `${uuid}-next` ||
                    i.customId === `${uuid}-prev` ||
                    i.customId === `${uuid}-trash`
            });

            for await (const [collected] of collector) {
                if (collected.customId.endsWith('-trash')) break;

                collected.customId.endsWith('next') ? page++ : page--;
                if (page < 0) page = pages.length - 1;
                if (page >= pages.length) page = 0;

                await collected.update({
                    embeds: [pages[page]],
                    components: i.components
                });
            }

            const last = collector.collected.last();

            if (
                collector.collected.size !== 0 &&
                last?.replied === false
            ) {
                return void await last.update({
                    components: disableAll(i)
                });
            } else {
                return void await rest.patch(
                    Routes.channelMessage('channelId' in i ? i.channelId : i.channel_id, i.id),
                    {
                        body: {
                            components: disableAll(i).map(e => e.toJSON())
                        }
                    }
                );
            }
        }

        const emojiOne = interaction.options.getString(SubcommandOptions.FIRST, true);
        const emojiTwo = interaction.options.getString(SubcommandOptions.SECOND, true);

        const query = `${emojiOne}_${emojiTwo}`;
        const oneParsed = parse(emojiOne);
        const twoParsed = parse(emojiTwo);

        if (oneParsed.map(p => p.text).join('') !== emojiOne) {
            return {
                content: '❌ First emoji could not be parsed correctly!',
                ephemeral: true
            }
        } else if (twoParsed.map(p => p.text).join('') !== emojiTwo) {
            return {
                content: '❌ Second emoji could not be parsed correctly!',
                ephemeral: true
            }
        }

        // https://github.com/UCYT5040/Google-Sticker-Mashup-Research
        const api = new URL('https://tenor.googleapis.com/v2/featured');
        api.searchParams.append('key', 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ');
        api.searchParams.append('client_key', 'gboard');
        api.searchParams.append('contentfilter', 'high');
        api.searchParams.append('media_filter', 'png_transparent');
        api.searchParams.append('component', 'proactive');
        api.searchParams.append('collection', 'emoji_kitchen_v5');
        api.searchParams.append('locale', 'en_US');
        api.searchParams.append('country', 'US');
        api.searchParams.append('q', query);

        const [err, res] = await dontThrow(request(api));

        if (err !== null) {
            return {
                content: `❌ An unexpected error occurred: ${inlineCode(err.message)}`,
                ephemeral: true
            }
        }

        const j = await res.body.json() as EmojiKitchen;

        if (j.results.length === 0) {
            return {
                content: '❌ One or more emojis you provided are not supported, or might not work as a combo.',
                ephemeral: true
            }
        }

        const embed = Embed.ok();
        EmbedUtil.setTitle(embed, `${emojiOne} + ${emojiTwo} =`);
        EmbedUtil.setImage(embed, { url: j.results[0].url });

        return {
            embeds: [embed]
        }
    }
}