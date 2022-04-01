import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { once } from '#khaf/utility/Memoize.js';
import { bold, type UnsafeEmbed } from '@discordjs/builders';
import type { Message } from 'discord.js';
import { parse, toCodePoints } from 'twemoji-parser';
import { request } from 'undici';

type IEmoji = {
    codePoints: string
    identifier: string
    comment: string
    isSub: undefined
    group: undefined
} | {
    codePoints: undefined
    identifier: undefined
    comment: undefined
    isSub: string
    group: string
}

const cache: Record<string, { [key in keyof IEmoji]: string }> = {};
const guildEmojiRegex = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/;
const unicodeRegex = /^((?<codePoints>.*?)\s+; (?<identifier>[a-z-]+)\s+# (?<comment>(.*?))|# (?<isSub>sub)?group: (?<group>(.*?)))$/gm;

const parseEmojiList = once(async () => {
    const { body } = await request('https://unicode.org/Public/emoji/14.0/emoji-test.txt');
    const fullList = await body.text();

    const list = fullList.matchAll(unicodeRegex);

    let group = '', subgroup = '';

    for (const item of list) {
        const {
            group: newGroup,
            isSub,
            codePoints,
            identifier,
            comment
        } = item.groups as unknown as IEmoji;

        if (newGroup !== undefined) {
            if (isSub === 'sub') {
                subgroup = newGroup
            } else {
                group = newGroup;
            }

            continue;
        }

        cache[codePoints] = { group, isSub: subgroup, codePoints, identifier, comment }
    }
});

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

        if ('1F600' in cache === false) {
            await parseEmojiList();
        }

        const unicodeEmoji = parse(content, { assetType: 'png' });

        if (unicodeEmoji.length !== 0) {
            const codePoints = toCodePoints(unicodeEmoji[0].text);
            const key = codePoints.join(' ').toUpperCase();

            if (key in cache === false) {
                return Embed.error('❌ This emoji is invalid or unsupported!');
            }

            const emoji = cache[key]
            return Embed.ok(unicodeEmoji[0].text)
                .setImage(unicodeEmoji[0].url)
                .addFields(
                    { name: bold('Name:'), value: emoji.comment, inline: true },
                    { name: bold('Category:'), value: emoji.group, inline: true },
                    { name: bold('Unicode:'), value: emoji.codePoints, inline: true }
                );
        }

        const name = Object.values(cache).find(n => n.comment.endsWith(content));

        if (name) {
            const unicodeEmoji = parse(name.comment, { assetType: 'png' })[0];

            return Embed.ok(unicodeEmoji.text)
                .setImage(unicodeEmoji.url)
                .addFields(
                    { name: bold('Name:'), value: name.comment, inline: true },
                    { name: bold('Category:'), value: name.group, inline: true },
                    { name: bold('Unicode:'), value: name.codePoints, inline: true }
                );
        }

        return Embed.error('❌ No emojis were found in your message!');
    }
}