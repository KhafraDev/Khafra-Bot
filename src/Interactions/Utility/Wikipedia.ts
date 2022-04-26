import { Interactions } from '#khaf/Interaction';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { ellipsis, plural } from '#khaf/utility/String.js';
import { hideLinkEmbed } from '@discordjs/builders';
import { getArticleById, search } from '@khaf/wikipedia';
import { randomUUID } from 'node:crypto';
import { ApplicationCommandOptionType, InteractionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import type { SelectMenuInteraction} from 'discord.js';
import { InteractionCollector, type ChatInputCommandInteraction, type InteractionReplyOptions } from 'discord.js';

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

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const content = interaction.options.getString('article', true);
        const wiki = await search(content);
        const id = randomUUID();

        if (wiki.pages.length === 0) {
            return {
                content: '❌ No Wikipedia articles for that query were found!',
                ephemeral: true
            }
        }

        const m = await interaction.editReply({
            content: `${wiki.pages.length} result${plural(wiki.pages.length)} found!`,
            embeds: [
                Embed.ok('Choose an article from the dropdown below!')
            ],
            components: [
                Components.actionRow([
                    Components.selectMenu({
                        custom_id: `wikipedia-${id}`,
                        placeholder: 'Which article summary would you like to get?',
                        options: wiki.pages.map(w => ({
                            label: ellipsis(w.title, 25),
                            description: ellipsis(w.excerpt.replaceAll(/<span.*?>(.*?)<\/span>/g, '$1'), 50),
                            value: `${w.id}`
                        }))
                    })
                ])
            ]
        });

        const c = new InteractionCollector<SelectMenuInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: m,
            time: 120_000,
            idle: 30_000,
            max: wiki.pages.length,
            filter: (i) =>
                i.user.id === interaction.user.id &&
                i.message.id === m.id &&
                i.customId.endsWith(id)
        });

        for await (const [i] of c) {
            await i.deferUpdate();

            const article = wiki.pages.find(p => i.values.includes(`${p.id}`))!;
            const summaryRes = await getArticleById(article.id);
            const summary = summaryRes.query?.pages[`${article.id}`];

            if (summary === undefined) {
                await i.editReply({
                    content: '❌ Invalid response from Wikipedia!',
                    components: disableAll(m)
                });

                continue;
            }

            const embed = Embed.json({
                color: colors.ok,
                description: ellipsis(summary.extract, 2048),
                title: summary.title,
                url: `https://en.wikipedia.org/wiki/${article.key}`
            });

            if (article.thumbnail) {
                const image = article.thumbnail.url.startsWith('http')
                    ? article.thumbnail.url
                    : `https:${article.thumbnail.url}`;

                embed.thumbnail = { url: image };
            }

            await i.editReply({
                content: hideLinkEmbed(`https://en.wikipedia.org/wiki/${article.key}`),
                embeds: [embed]
            });
        }

        // Prevent making an extra API call if the menu is already disabled
        const componentList = m.components?.[0].components[0];
        const raw = componentList !== undefined && 'toJSON' in componentList
            ? componentList.toJSON()
            : componentList;

        if (raw !== undefined && raw.disabled !== true) {
            await interaction.editReply({
                components: disableAll(m)
            });
        }
    }
}