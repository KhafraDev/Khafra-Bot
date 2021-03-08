import { Command } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { URL } from 'url';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Add an emoji to the server!',
                'my_emoji [image attachment]',
                'amogus https://cdn.discordapp.com/emojis/812093828978311219.png?v=1'
            ],
			{
                name: 'addemoji',
                folder: 'Server',
                args: [1, 2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.MANAGE_EMOJIS ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const fileFromArgs = args.length === 2
            ? args.pop()
            : message.attachments.first();

        if (!fileFromArgs) 
            return this.Embed.generic(this, 'No attachment was included and no image link was provided!');

        const file = new URL(typeof fileFromArgs === 'string' ? fileFromArgs : fileFromArgs.url);

        if (!/(.png|.jpe?g|.webp|.gif)/.test(file.href))
            return this.Embed.fail('Not a valid image/gif link!');

        const e = await message.guild.emojis.create(
            file.toString(),
            args[0],
            { reason: `${message.author.id} (${message.author.tag}) requested.` }
        );

        return this.Embed.success(`Added ${e} to the guild emojis!`);
    }
}