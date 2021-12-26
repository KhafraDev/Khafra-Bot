import { Command, Arguments } from '#khaf/Command';
import { Message, MessageAttachment, Permissions } from 'discord.js';
import { validURL } from '#khaf/utility/Valid/URL.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@khaf/builders';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Add an emoji to the server!',
                'my_emoji [image attachment]',
                'amogus https://cdn.discordapp.com/emojis/812093828978311219.png?v=1',
                'https://cdn.discordapp.com/emojis/812093828978311219.png?v=1 amogus'
            ],
			{
                name: 'addemoji',
                folder: 'Server',
                args: [1, 2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS ]
            }
        );
    }

    async init(message: Message<true>, { args }: Arguments) {
        if (args.length === 1 && message.attachments.size === 0)
            return this.Embed.generic(this, 'No attachment was included and no image link was provided!');

        let name: string | null = null,
            link: string | MessageAttachment | null = null;

        if (args.length === 1) {
            name = args[0];
            link = message.attachments.first() ?? null;
        } else {
            const info = validURL(args);
            if (info.length === 0 || info[0].url === null)
                return this.Embed.error(`No image link provided!`);

            name = args[Number(!info[0].idx)];
            link = `${info[0].url}`;
        }

        if (link instanceof MessageAttachment) {
            if (link.size > 256_000)
                return this.Embed.error(`Guild emojis can only be a maximum of 256kb! Try a smaller image!`);

            link = link.url;
        } else if (typeof link !== 'string') {
            return this.Embed.error('Invalid link!');
        }

        const [createError, e] = await dontThrow(message.guild.emojis.create(
            link,
            name,
            { reason: `${message.author.id} (${message.author.tag}) requested.` }
        ));

        if (createError !== null) {
            return this.Embed.error(`An unexpected error occurred: ${inlineCode(createError.message)}`);
        }

        return this.Embed.ok(`Added ${e} to the guild emojis!`);
    }
}