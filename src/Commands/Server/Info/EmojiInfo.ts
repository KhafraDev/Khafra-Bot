import { bold, inlineCode } from '@khaf/builders';
import { Message } from 'discord.js';
import { join } from 'path';
import { parse, toCodePoints } from 'twemoji-parser';
import { padEmbedFields } from '#khaf/utility/Constants/Embeds.js';
import { assets } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { plural } from '#khaf/utility/String.js';
import { Arguments, Command } from '#khaf/Command';

const guildEmojiRegex = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/;
const Emojis = createFileWatcher(
    {} as typeof import('../../../../assets/JSON/Emojis.json'),
    join(assets, 'JSON/Emojis.json')
);

interface BaseUnicodeEmoji {
    names: string[]
}

interface DiverseUnicodeEmoji extends BaseUnicodeEmoji {
    hasDiversity: true
    diversityChildren: {
        names: string[]
        surrogates: string
        diversity: string[]
    }[]
}

type Emojis = Record<string, BaseUnicodeEmoji | DiverseUnicodeEmoji>;

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get info about an emoji!',
                '<emoji>'
            ],
			{
                name: 'emojiinfo',
                folder: 'Server',
                aliases: [ 'emojinfo', 'guildemoji' ],
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message<true>, { content }: Arguments) {
        const guildEmoji = guildEmojiRegex.exec(content);

        if (guildEmoji === null || guildEmoji.groups === undefined) {
            const parsed = parse(content, { assetType: 'png' });
            if (parsed.length === 0) 
                return this.Embed.error(`No unicode emojis were in the message!`);

            const codePoints = toCodePoints(parsed[0]!.text);
            let emoji = parsed[0].text;

            while (!(emoji in Emojis)) {
                const codepoints = toCodePoints(emoji);
                if (codepoints.length <= 1)
                    break;

                emoji = codepoints
                    .slice(0, -1)
                    .map(p => String.fromCodePoint(Number.parseInt(p, 16)))
                    .join('');
            }
            
            const embed = this.Embed.ok()
                .setImage(parsed[0].url)
                .setURL(`http://www.get-emoji.com/${encodeURIComponent(parsed[0].text)}`)
                .addField({
                    name: bold('Code Points:'),
                    value: `\\u${codePoints.join('\\u')}`,
                    inline: true
                });

            const e = (<Emojis>Emojis)[emoji];
            if (typeof e !== 'undefined') {
                if (emoji === parsed[0].text) { // top level emoji
                    if ('diversityChildren' in e && e.diversityChildren.length > 0) // has diversity
                        embed.setDescription(`
                        ${bold('Names:')} ${inlineCode(e.names.join('``/``'))}
                        ${bold('Diversity/Children:')} ${inlineCode(e.diversityChildren.map(d => d.surrogates).join('``, ``'))}
                        `);
                    else 
                        embed.setDescription(`${bold('Names:')} ${inlineCode(e.names.join('``/``'))}`);
                } else if ('hasDiversity' in e) { // just so I don't have to keep casting the value
                    // has to exist because of the check above
                    const child = e.diversityChildren.find(c => c.surrogates === parsed[0].text)!;

                    embed.setDescription(`
                    ${bold('Names:')} ${inlineCode(child.names.join('``/``'))}
                    ${bold('Similar:')} ${inlineCode(e.diversityChildren.map(c => c.surrogates).join('``/``'))}
                    `);

                    embed.addField({
                        name: `${bold(`Tone${plural(child.diversity.length)}:`)}`,
                        value: child.diversity.length === 0
                            ? 'None' 
                            : child.diversity.map(d => String.fromCodePoint(Number.parseInt(d, 16))).join(', '),
                        inline: true
                    });
                }
            }

            return padEmbedFields(embed);
        } else if (!message.guild.emojis.cache.has(guildEmoji.groups.id)) {
            return this.Embed.error(`Emoji isn't cached, whoops!`);
        }

        const emoji = message.guild.emojis.cache.get(guildEmoji.groups.id)!;

        return this.Embed.ok(`${emoji}`)
            .setTitle(emoji.name ?? 'Unknown')
            .setImage(emoji.url)
            .addFields(
                { name: bold('ID:'), value: emoji.id, inline: true },
                { name: bold('Animated:'), value: emoji.animated ? 'Yes' : 'No', inline: true },
                { name: bold('Managed:'), value: emoji.managed ? 'Yes' : 'No', inline: true }
            );
    }
}