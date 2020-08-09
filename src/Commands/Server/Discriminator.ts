import { Command } from "../../Structures/Command";
import { Message, Collection, GuildMember } from "discord.js";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            { name: 'discrim', folder: 'Server' },
            [
                'Get all users with a certain discriminator!',
                '1337', '0001'
            ],
            [ /* No extra perms needed */ ],
            30,
            [ 'discriminator' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 1 || Number.isNaN(Number(args[0]))) {
            return message.channel.send(Embed.missing_args(1, this.name.name, this.help.slice(1)));
        }

        let members: Collection<string, GuildMember>;
        try {
            members = await message.guild.members.fetch();
        } catch {
            return message.channel.send(Embed.fail('An error occurred fetching members!'));
        }

        const discrims = members
            .filter(member => member.user.discriminator === args[0])
            .array();

        let cached: Collection<string, GuildMember>;
        try {
            cached = await message.guild.members.fetch({ user: discrims.map(member => member.id) });
        } catch {
            return message.channel.send(Embed.fail('An error occurred caching users!'));
        }

        const formatted = Array.from(cached.values()).map(member => `\`\`${member.user.tag}\`\``);
        const embed = Embed.success()
            .setDescription(`
            Found **${formatted.length}** user${formatted.length === 1 ? '' : 's'}!
            ${formatted.join(', ')}
            `.slice(0, 2048))
            .setFooter('Requested by ' + message.author.tag, message.author.displayAvatarURL())
            .setTimestamp();

        return message.channel.send(embed);
    }
}