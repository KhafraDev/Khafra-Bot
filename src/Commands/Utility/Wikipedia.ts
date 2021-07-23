import { Command, Arguments } from '../../Structures/Command.js';
import { Message, MessageActionRow, MessageSelectMenu, SelectMenuInteraction } from 'discord.js';
import { search, getArticleById } from '@khaf/wikipedia';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { hideLinkEmbed, inlineCode } from '@discordjs/builders';
import { ellipsis, plural } from '../../lib/Utility/String.js';
import { disableAll } from '../../lib/Utility/Constants/Components.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Search Wikipedia for an article!',
                'Jupiter', 'Green Day'
            ],
			{
                name: 'wikipedia',
                folder: 'Utility',
                args: [1],
                aliases: [ 'wiki' ]
            }
        );
    }

    async init(message: Message, { content }: Arguments) {
        const [err, wiki] = await dontThrow(search(content));
        if (err) {
            return this.Embed.fail(`An error occurred processing this request: ${inlineCode(err.message)}`);
        } else if (wiki.pages.length === 0) {
            return this.Embed.fail('No Wikipedia articles for that query were found!');
        }

        const m = await message.reply({
            content: `${wiki.pages.length} result${plural(wiki.pages.length)} found!`,
            embeds: [
                this.Embed.success(`Choose an article from the dropdown below!`)
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
        });

        const c = m.createMessageComponentCollector({
            max: wiki.pages.length,
            idle: 30_000,
            filter: (interaction) =>
                interaction.user.id === message.author.id &&
                interaction.isSelectMenu() &&
                wiki.pages.some(p => interaction.values.includes(`${p.id}`))
        });

        c.on('collect', async (i: SelectMenuInteraction) => {
            await dontThrow(i.deferUpdate());

            const article = wiki.pages.find(p => i.values.includes(`${p.id}`));
            const [err, summaryRes] = await dontThrow(getArticleById(article.id));

            if (err) {
                return void dontThrow(i.editReply({
                    embeds: [
                        this.Embed.fail(`An error occurred getting this article's summary: ${inlineCode(err.message)}`)
                    ],
                    components: disableAll(m)
                }));
            }

            const summary = summaryRes.query?.pages[`${article.id}`];
            if (typeof summary === 'undefined') {
                return void dontThrow(i.editReply({
                    embeds: [this.Embed.fail('Invalid response from Wikipedia!')],
                    components: disableAll(m)
                }));
            }

            const embed = this.Embed.success()
                .setDescription(ellipsis(summary.extract, 2048))
                .setTitle(summary.title)
                .setURL(`https://en.wikipedia.org/wiki/${article.key}`)

            if (article.thumbnail) {
                const image = article.thumbnail.url?.startsWith('http')
                    ? article.thumbnail.url
                    : `https:${article.thumbnail.url}`;

                embed.setThumbnail(image);
            }

            return void dontThrow(i.editReply({
                content: hideLinkEmbed(`https://en.wikipedia.org/wiki/${article.key}`),
                embeds: [embed]
            }));
        });
    }
}