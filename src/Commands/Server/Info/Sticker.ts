import { bold, inlineCode } from '@khaf/builders';
import { Message } from 'discord.js';
import { padEmbedFields } from '#khaf/utility/Constants/Embeds.js';
import { Command } from '#khaf/Command';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get info about a sticker!',
                '<sticker>'
            ],
			{
                name: 'sticker',
                folder: 'Server',
                aliases: [ 'stickers' ],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init({ stickers, guild }: Message<true>) {
        if (stickers.size === 0)
            return this.Embed.error('No stickers in message! 😕');

        const sticker = stickers.first()!;
        
        if (sticker.partial) {
            await guild.stickers.fetch(sticker.id);
        }

        const embed = this.Embed.ok()
            .setTitle(`${sticker.name}${sticker.description ? ` - ${sticker.description}` : ''}`)
            .addField(bold('Name:'), inlineCode(sticker.name), true)
            .addField(bold('ID:'), inlineCode(sticker.id), true);

        if (sticker.packId !== null) {
            embed.addField(bold('Pack ID:'), inlineCode(sticker.packId), true);
        } else if (sticker.guildId !== null) {
            embed.addField(bold('Guild Sticker:'), inlineCode(`Yes - ${sticker.guild}`));
        }
        
        if (Array.isArray(sticker.tags) && sticker.tags.length > 0) {
            embed.setDescription(`${bold('Tags:')}\n${sticker.tags.map(t => inlineCode(t)).join(', ')}`);
        }

        if (sticker.format === 'LOTTIE') {
            embed.setImage(`http://distok.top/stickers/${sticker.packId}/${sticker.id}.gif`);
        } else {
            embed.setImage(sticker.url);
        }

        return padEmbedFields(embed);
    }
}