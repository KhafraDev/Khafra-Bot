import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

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

    async init({ stickers }: Message) {
        if (stickers.size === 0)
            return this.Embed.fail('No stickers in message! 😕');

        const sticker = stickers.first()!;

        return this.Embed.success()
            .setTitle(`${sticker.name} - ${sticker.description}`)
            .setDescription(`
            **Tags:**
            \`\`${sticker.tags.join('\`\`, \`\`')}\`\`
            `)
            .addField('**Pack ID:**', `\`\`${sticker.packID}\`\``, true)
            .addField('**ID:**', `\`\`${sticker.id}\`\``)
            // "If the sticker's format is LOTTIE, it returns the URL of the Lottie json file. 
            // Lottie json files must be converted in order to be displayed in Discord."
            .setImage(`${sticker.format}` !== 'LOTTIE'
                ? sticker.url 
                : `http://distok.top/stickers/${sticker.packID}/${sticker.id}.gif`
            );
    }
}