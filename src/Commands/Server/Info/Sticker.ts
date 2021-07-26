import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { padEmbedFields } from '../../../lib/Utility/Constants/Embeds.js';
import { bold, inlineCode } from '@discordjs/builders';
import { Message } from '../../../lib/types/Discord.js.js';

@RegisterCommand
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

    async init({ stickers, guild }: Message) {
        if (stickers.size === 0)
            return this.Embed.fail('No stickers in message! 😕');

        const sticker = stickers.first()!;
        
        if (sticker.partial) {
            await guild.stickers.fetch(sticker.id);
        }

        const embed = this.Embed.success()
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