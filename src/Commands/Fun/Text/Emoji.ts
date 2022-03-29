import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Message } from 'discord.js';
import { parse } from 'twemoji-parser';

const GUILD_EMOJI_REG = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/g;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Enlarge an emoji!',
                '🦸 🤠', '🥙', '<:Jack:579367928722489346>'
            ],
            {
                name: 'emoji',
                folder: 'Fun',
                args: [1, 5],
                ratelimit: 3,
                permissions: [PermissionFlagsBits.AttachFiles],
                guildOnly: true
            }
        );
    }

    async init (message: Message<true>): Promise<string | UnsafeEmbed> {
        const unicode = parse(message.content, { assetType: 'png' })
            .map(e => e.url);

        const guild = [...message.content.matchAll(GUILD_EMOJI_REG)]
            .filter(e => message.guild.emojis.cache.has(e[3]))
            .map(e => message.guild.emojis.resolve(e[3])!.url);

        const all =  [...unicode, ...guild];

        if (all.length === 0)
            return Embed.error('No guild or unicode emojis were in the message! 😕');

        return all.join('\n');
    }
}