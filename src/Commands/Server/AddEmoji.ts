import { Command, Arguments } from '../../Structures/Command.js';
import { GuildEmoji, Message, MessageAttachment, Permissions } from 'discord.js';
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

    async init(message: Message, { args }: Arguments) {
        const fileFromArgs = args.length === 2
            ? args.pop()
            : message.attachments.first();

        if (!fileFromArgs) 
            return this.Embed.generic(this, 'No attachment was included and no image link was provided!');

        const file = new URL(typeof fileFromArgs === 'string' ? fileFromArgs : fileFromArgs.url);

        if (!/(.png|.jpe?g|.webp|.gif)/.test(file.href))
            return this.Embed.fail('Not a valid image/gif link!');

        // MessageAttachment provides us with this information, a url does not.
        // this is a check to cut down on API requests by checking for file size.
        if (fileFromArgs instanceof MessageAttachment)
            if (fileFromArgs.size / 1000 > 256) // size is in bytes, convert to kb
                return this.Embed.fail('Discord disallows images (or gifs) larger than 256 kb!');

        let e: GuildEmoji | null = null;
        try {
            e = await message.guild.emojis.create(
                file.toString(),
                args[0],
                { reason: `${message.author.id} (${message.author.tag}) requested.` }
            );
        } catch (e) {
            return this.Embed.fail(e.message);
        }

        return this.Embed.success(`Added ${e} to the guild emojis!`);
    }
}