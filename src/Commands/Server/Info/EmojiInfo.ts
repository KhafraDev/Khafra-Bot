import { Arguments, Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold, type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';
import { parse, toCodePoints } from 'twemoji-parser';
import { fetch } from 'undici';

interface IEmoji {
    name: string
    category: string
    group: string
    htmlCode: string[]
    unicode: string[]
}

const cache: IEmoji[] = [];
const guildEmojiRegex = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get info about an emoji!',
                '<emoji>', 'united states'
            ],
            {
                name: 'emojiinfo',
                folder: 'Server',
                aliases: ['emojinfo', 'guildemoji'],
                args: [1],
                guildOnly: true
            }
        );
    }

    async init (_message: Message<true>, { content }: Arguments): Promise<UnsafeEmbed> {
        if (guildEmojiRegex.test(content)) {
            const match = guildEmojiRegex.exec(content)!;
            const { id, name, animated } = match.groups as Record<string, string>;
            const url = `https://cdn.discordapp.com/emojis/${id}.webp`;

            return Embed.ok(match[0])
                .setTitle(name)
                .setImage(url)
                .addFields(
                    { name: bold('ID:'), value: id, inline: true },
                    { name: bold('Name:'), value: name, inline: true },
                    { name: bold('Animated:'), value: animated === 'a' ? 'Yes' : 'No', inline: true }
                );
        }

        if (cache.length === 0) {
            const r = await fetch('https://emojihub.herokuapp.com/api/all');
            const j = await r.json() as IEmoji[];

            cache.push(...j);
        }

        const unicodeEmoji = parse(content, { assetType: 'png' });

        if (unicodeEmoji.length !== 0) {
            const codePoints = toCodePoints(unicodeEmoji[0].text);
            const emoji = cache.find(e =>
                e.unicode.length === codePoints.length &&
				e.unicode.every(
				    cp => codePoints.includes(cp.slice(2).toLowerCase())
				)
            );

            if (emoji === undefined) {
                return Embed.error('❌ This emoji is invalid or unsupported!');
            }

            return Embed.ok(unicodeEmoji[0].text)
                .setImage(unicodeEmoji[0].url)
                .addFields(
                    { name: bold('Name:'), value: emoji.name, inline: true },
                    { name: bold('Category:'), value: emoji.category, inline: true },
                    { name: bold('Unicode:'), value: emoji.unicode.join(' '), inline: true }
                );
        }

        const name = cache.find(e => e.name === content);

        if (name) {
            const unicodeEmojiText = name.unicode
                .map(t => String.fromCodePoint(Number.parseInt(t, 16)))
                .join('');
            const unicodeEmoji = parse(unicodeEmojiText, { assetType: 'png' })[0];

            return Embed.ok(unicodeEmoji.text)
                .setImage(unicodeEmoji.url)
                .addFields(
                    { name: bold('Name:'), value: name.name, inline: true },
                    { name: bold('Category:'), value: name.category, inline: true },
                    { name: bold('Unicode:'), value: name.unicode.join(' '), inline: true }
                );
        }

        return Embed.error('❌ No emojis were found in your message!');
    }
}