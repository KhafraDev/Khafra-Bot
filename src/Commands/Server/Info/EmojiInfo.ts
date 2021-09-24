import { parse, toCodePoints } from 'twemoji-parser';
import { Arguments, Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { plural } from '../../../lib/Utility/String.js';
import { padEmbedFields } from '../../../lib/Utility/Constants/Embeds.js';
import { Message } from '../../../lib/types/Discord.js.js';
import { createFileWatcher } from '../../../lib/Utility/FileWatcher.js';
import { cwd } from '../../../lib/Utility/Constants/Path.js';
import { join } from 'path';

const guildEmojiRegex = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/;
const Emojis = {} as typeof import('../../../../assets/JSON/Emojis.json');
createFileWatcher(Emojis, join(cwd, 'assets/JSON/Emojis.json'));

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

@RegisterCommand
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

    async init(message: Message, { content }: Arguments) {
        const guildEmoji = guildEmojiRegex.exec(content);

        if (guildEmoji === null || guildEmoji.groups === undefined) {
            const parsed = parse(content, { assetType: 'png' });
            if (parsed.length === 0) 
                return this.Embed.fail(`No unicode emojis were in the message!`);

            const codePoints = toCodePoints(parsed[0]!.text);
            let emoji = parsed[0].text;

            while (!Emojis[emoji as keyof typeof Emojis]) {
                const codepoints = toCodePoints(emoji);
                if (codepoints.length <= 1)
                    break;

                emoji = codepoints
                    .slice(0, -1)
                    .map(p => String.fromCodePoint(Number.parseInt(p, 16)))
                    .join('');
            }
            
            const embed = this.Embed.success()
                .setImage(parsed[0].url)
                .setURL(`http://www.get-emoji.com/${encodeURIComponent(parsed[0].text)}`)
                .addField(`**Code Points:**`, `\\u${codePoints.join('\\u')}`, true);

            const e = (<Emojis>Emojis)[emoji];
            if (typeof e !== 'undefined') {
                if (emoji === parsed[0].text) { // top level emoji
                    if ('diversityChildren' in e && e.diversityChildren.length > 0) // has diversity
                        embed.setDescription(`
                        **Names:** \`\`${e.names.join('``/``')}\`\`
                        **Diversity/Children:** \`\`${e.diversityChildren.map(d => d.surrogates).join('``, ``')}\`\`
                        `);
                    else 
                        embed.setDescription(`**Names:** \`\`${e.names.join('``/``')}\`\``);
                } else if ('hasDiversity' in e) { // just so I don't have to keep casting the value
                    // has to exist because of the check above
                    const child = e.diversityChildren.find(c => c.surrogates === parsed[0].text)!;

                    embed.setDescription(`
                    **Names:** \`\`${child.names.join('``/``')}\`\`
                    **Similar:** \`\`${e.diversityChildren.map(c => c.surrogates).join('``/``')}\`\`
                    `);

                    embed.addField(
                        `**Tone${plural(child.diversity.length)}:**`,
                        child.diversity.length === 0
                            ? 'None' 
                            : child.diversity.map(d => String.fromCodePoint(Number.parseInt(d, 16))).join(', '),
                        true
                    );
                }
            }

            return padEmbedFields(embed);
        } else if (!message.guild.emojis.cache.has(guildEmoji.groups.id)) {
            return this.Embed.fail(`Emoji isn't cached, whoops!`);
        }

        const emoji = message.guild.emojis.cache.get(guildEmoji.groups.id)!;

        return this.Embed.success(`${emoji}`)
            .setTitle(emoji.name ?? 'Unknown')
            .setImage(emoji.url)
            .addFields(
                { name: '**ID:**', value: emoji.id, inline: true },
                { name: '**Animated:**', value: emoji.animated ? 'Yes' : 'No', inline: true },
                { name: '**Managed:**', value: emoji.managed ? 'Yes' : 'No', inline: true }
            );
    }
}