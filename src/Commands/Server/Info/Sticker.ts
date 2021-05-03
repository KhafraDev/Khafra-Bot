import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

// this isn't exported by Discord.js' typings, so we
// have to re-declare it here.
enum StickerFormatTypes {
    PNG = 1,
    APNG = 2,
    LOTTIE = 3
}

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

        // Notice: there isn't much useful information here
        // so I leave out a pretty big chunk of the sticker.
        // there's nothing you can do with a sticker id, asset id, etc.
        // so they weren't included.

        return this.Embed.success()
            .setTitle(`${sticker.name} - ${sticker.description}`)
            .setDescription(`
            **Tags:**
            \`\`${sticker.tags.join('\`\`, \`\`')}\`\`
            `)
            // "If the sticker's format is LOTTIE, it returns the URL of the Lottie json file. 
            // Lottie json files must be converted in order to be displayed in Discord."
            .setImage(sticker.format !== StickerFormatTypes.LOTTIE ? sticker.url : undefined);
    }
}