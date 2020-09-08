import { Command } from "../../Structures/Command";
import { Message, GuildEmoji } from "discord.js";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            [
                'Steal an emoji from another server! This command requires the user to have Nitro.',
                '[guild emoji]',
                '<:smithcube:731943728436084787>'
            ],
            [ 'MANAGE_EMOJIS' ],
            {
                name: 'steal',
                folder: 'Server',
                args: [1, 1],
                guildOnly: true 
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length !== 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        } else if(!/<?(a)?:?(\w{2,32}):(\d{17,19})>?/.test(args[0])) {
            return message.channel.send(Embed.missing_args.call(this, 1, 'Invalid Emoji provided!'));
        }

        const [,, name, id] = args[0].match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/);
        if(!name || !id) {
            return message.channel.send(Embed.missing_args.call(this, 1, 'Invalid guild emoji provided!'));
        }
               
        let emoji: GuildEmoji;
        try {
            emoji = await message.guild.emojis.create(
                `https://cdn.discordapp.com/emojis/${id}.png?v=1`,
                name, 
                { reason: `Khafra-Bot: requested by ${message.author.tag} (${message.author.id}).` }
            );
        } catch(e) {
            return message.channel.send(Embed.fail(`
            An error occurred creating this emoji!
            \`\`${e.toString()}\`\`
            `));
        }

        return message.channel.send(Embed.success(`
        Created emoji ${emoji} with name ${name}.
        `));
    }
}