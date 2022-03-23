import { Arguments, Command } from '#khaf/Command';
import { type UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Steal an emoji from another server! This command requires the user to have Nitro.',
                '[guild emoji]',
                '<:smithcube:731943728436084787>'
            ],
            {
                name: 'steal',
                folder: 'Server',
                args: [1, 1],
                guildOnly: true,
                permissions: [PermissionFlagsBits.ManageEmojisAndStickers]
            }
        );
    }

    async init (message: Message<true>, { args }: Arguments): Promise<UnsafeEmbed> {
        if (!/<?(a)?:?(\w{2,32}):(\d{17,19})>?/.test(args[0])) {
            return this.Embed.error('Invalid Emoji provided!');
        }

        const [,, name, id] = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/.exec(args[0]) ?? [];
        if (!name || !id) {
            return this.Embed.error('Invalid guild emoji provided!');
        }

        const emoji = await message.guild.emojis.create(
            `https://cdn.discordapp.com/emojis/${id}.png?v=1`,
            name,
            { reason: `Khafra-Bot: requested by ${message.author.tag} (${message.author.id}).` }
        );

        return this.Embed.ok(`
        Created emoji ${emoji} with name ${name}.
        `);
    }
}