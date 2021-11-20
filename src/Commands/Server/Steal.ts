import { Command, Arguments } from '../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { Message } from '../../lib/types/Discord.js.js';

export class kCommand extends Command {
    constructor() {
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
                permissions: [ Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        if (!/<?(a)?:?(\w{2,32}):(\d{17,19})>?/.test(args[0])) {
            return this.Embed.fail('Invalid Emoji provided!');
        }

        const [,, name, id] = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/.exec(args[0]) ?? [];
        if (!name || !id) {
            return this.Embed.fail('Invalid guild emoji provided!');
        }
               
        const emoji = await message.guild.emojis.create(
            `https://cdn.discordapp.com/emojis/${id}.png?v=1`,
            name, 
            { reason: `Khafra-Bot: requested by ${message.author.tag} (${message.author.id}).` }
        );

        return this.Embed.success(`
        Created emoji ${emoji} with name ${name}.
        `);
    }
}