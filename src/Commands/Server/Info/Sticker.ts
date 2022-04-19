import { Command } from '#khaf/Command';
import { Embed, EmbedUtil, padEmbedFields } from '#khaf/utility/Constants/Embeds.js';
import { bold, inlineCode } from '@discordjs/builders';
import type { APIEmbed} from 'discord-api-types/v10';
import { StickerFormatType } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get info about a sticker!',
                '<sticker>'
            ],
            {
                name: 'sticker',
                folder: 'Server',
                aliases: ['stickers'],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init ({ stickers, guild }: Message<true>): Promise<APIEmbed> {
        if (stickers.size === 0)
            return Embed.error('No stickers in message! 😕');

        const sticker = stickers.first()!;

        if (sticker.partial) {
            await guild.stickers.fetch(sticker.id);
        }

        const embed = Embed.ok();
        EmbedUtil.setTitle(embed, `${sticker.name}${sticker.description ? ` - ${sticker.description}` : ''}`);
        EmbedUtil.addFields(
            embed,
            { name: bold('Name:'), value: inlineCode(sticker.name), inline: true },
            { name: bold('ID:'), value: inlineCode(sticker.id), inline: true }
        );

        if (sticker.packId !== null) {
            EmbedUtil.addFields(
                embed,
                {
                    name: bold('Pack ID:'),
                    value: inlineCode(sticker.packId),
                    inline: true
                }
            );
        } else if (sticker.guildId !== null) {
            EmbedUtil.addFields(embed, {
                name: bold('Guild Sticker:'),
                value: inlineCode(`Yes - ${sticker.guild}`)
            });
        }

        if (Array.isArray(sticker.tags) && sticker.tags.length > 0) {
            EmbedUtil.setDescription(embed, `${bold('Tags:')}\n${sticker.tags.map(t => inlineCode(t)).join(', ')}`);
        }

        if (sticker.format === StickerFormatType.Lottie) {
            EmbedUtil.setImage(
                embed,
                { url: `http://distok.top/stickers/${sticker.packId}/${sticker.id}.gif` }
            );
        } else {
            EmbedUtil.setImage(embed, { url: sticker.url });
        }

        return padEmbedFields(embed);
    }
}