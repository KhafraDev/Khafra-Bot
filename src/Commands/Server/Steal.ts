import { Command } from "../../Structures/Command.js";
import { Message, GuildEmoji, Permissions } from "discord.js";

export default class extends Command {
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
                permissions: [ Permissions.FLAGS.MANAGE_EMOJIS ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!/<?(a)?:?(\w{2,32}):(\d{17,19})>?/.test(args[0])) {
            return message.reply(this.Embed.fail('Invalid Emoji provided!'));
        }

        const [,, name, id] = args[0].match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/);
        if(!name || !id) {
            return message.reply(this.Embed.fail('Invalid guild emoji provided!'));
        }
               
        let emoji: GuildEmoji;
        try {
            emoji = await message.guild.emojis.create(
                `https://cdn.discordapp.com/emojis/${id}.png?v=1`,
                name, 
                { reason: `Khafra-Bot: requested by ${message.author.tag} (${message.author.id}).` }
            );
        } catch(e) {
            return message.reply(this.Embed.fail(`
            An error occurred creating this emoji!
            \`\`${e.toString()}\`\`
            `));
        }

        return message.reply(this.Embed.success(`
        Created emoji ${emoji} with name ${name}.
        `));
    }
}