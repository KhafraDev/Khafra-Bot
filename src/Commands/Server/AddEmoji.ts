import { Command, Arguments } from '../../Structures/Command.js';
import { GuildEmoji, Message, MessageAttachment, Permissions } from 'discord.js';
import { URL } from 'url';
import { RegisterCommand } from '../../Structures/Decorator.js';

const findURL = (args: string[]) => {
    for (let i = 0; i < args.length; i++) {
        try {
            return { i, u: new URL(args[i]) }
        } catch {}
    }
}

@RegisterCommand
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
                permissions: [ Permissions.FLAGS.MANAGE_EMOJIS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        if (args.length === 1 && message.attachments.size === 0)
            return this.Embed.generic(this, 'No attachment was included and no image link was provided!');

        let name: string | null = null,
            link: string | MessageAttachment | null = null;

        if (args.length === 1) {
            name = args[0];
            link = message.attachments.first();
        } else {
            const info = findURL(args);
            if (!info)
                return this.Embed.fail(`No image link provided!`);

            name = args[Number(!info.i)];
            link = `${info.u}`;
        }

        if (link instanceof MessageAttachment) {
            if (link.size > 256_000)
                return this.Embed.fail(`Guild emojis can only be a maximum of 256kb! Try a smaller image!`);

            link = link.url;
        }

        let e: GuildEmoji | null = null;
        try {
            e = await message.guild.emojis.create(
                link,
                name,
                { reason: `${message.author.id} (${message.author.tag}) requested.` }
            );
        } catch (e) {
            return this.Embed.fail(e.message);
        }

        return this.Embed.success(`Added ${e} to the guild emojis!`);
    }
}