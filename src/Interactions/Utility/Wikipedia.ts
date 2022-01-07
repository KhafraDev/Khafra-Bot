import { CommandInteraction, InteractionCollector, Message, MessageActionRow, MessageSelectMenu, SelectMenuInteraction } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { hideLinkEmbed, inlineCode } from '@khaf/builders';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { getArticleById, search } from '@khaf/wikipedia';
import { ellipsis, plural } from '#khaf/utility/String.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { InteractionType } from 'discord-api-types';
import { disableAll } from '#khaf/utility/Constants/Components.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'wikipedia',
            description: 'Retrieves the content of a Wikipedia article.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'article',
                    description: 'Article name to get a summary for.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const content = interaction.options.getString('article', true);
        const [err, wiki] = await dontThrow(search(content));

        if (err !== null) {
            return `❌ An error occurred processing this request: ${inlineCode(err.message)}`;
        } else if (wiki.pages.length === 0) {
            return '❌ No Wikipedia articles for that query were found!';
        }

        const m = await interaction.editReply({
            content: `${wiki.pages.length} result${plural(wiki.pages.length)} found!`,
            embeds: [
                Embed.ok(`Choose an article from the dropdown below!`)
            ],
            components: [
                new MessageActionRow().addComponents(
                    new MessageSelectMenu()
                        .setCustomId('wikipedia')
                        .setPlaceholder('Which article summary would you like to get?')
                        .addOptions(wiki.pages.map(w => ({
                            label: ellipsis(w.title, 25),
                            description: ellipsis(w.excerpt.replaceAll(/<span.*?>(.*?)<\/span>/g, '$1'), 50),
                            value: `${w.id}`
                        })))
                )
            ]
        }) as Message;

        const c = new InteractionCollector<SelectMenuInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent as number,
            message: m,
            time: 120_000,
            idle: 30_000,
            max: wiki.pages.length,
            filter: (i) =>
                i.user.id === interaction.user.id
        });

        c.on('collect', async (i) => {
            await dontThrow(i.deferUpdate());

            const article = wiki.pages.find(p => i.values.includes(`${p.id}`))!;
            const [err, summaryRes] = await dontThrow(getArticleById(article.id));

            if (err) {
                return void dontThrow(i.editReply({
                    content: `❌ An error occurred getting this article's summary: ${inlineCode(err.message)}`,
                    components: disableAll(m)
                }));
            }

            const summary = summaryRes.query?.pages[`${article.id}`];
            if (typeof summary === 'undefined') {
                return void dontThrow(i.editReply({
                    content: '❌ Invalid response from Wikipedia!',
                    components: disableAll(m)
                }));
            }

            const embed = Embed.ok()
                .setDescription(ellipsis(summary.extract, 2048))
                .setTitle(summary.title)
                .setURL(`https://en.wikipedia.org/wiki/${article.key}`)

            if (article.thumbnail) {
                const image = article.thumbnail.url.startsWith('http')
                    ? article.thumbnail.url
                    : `https:${article.thumbnail.url}`;

                embed.setThumbnail(image);
            }

            return void dontThrow(i.editReply({
                content: hideLinkEmbed(`https://en.wikipedia.org/wiki/${article.key}`),
                embeds: [embed]
            }));
        });

        c.once('end', () => {
            if (m.components[0].components[0].disabled === false) {
                void dontThrow(m.edit({
                    components: disableAll(m)
                }));
            }
        });
    }
} 