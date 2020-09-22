import { Command } from "../../Structures/Command";
import { Message, Collection, GuildMember } from "discord.js";


export default class extends Command {
    constructor() {
        super(
            [
                'Get all users with a certain discriminator!',
                '1337', '0001'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'discrim',
                folder: 'Server',
                aliases: [ 'discriminator' ],
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(Number.isNaN(+args[0])) {
            return message.channel.send(this.Embed.generic('Argument isn\'t a number!'));
        }

        let members: Collection<string, GuildMember>;
        try {
            members = await message.guild.members.fetch();
        } catch {
            return message.channel.send(this.Embed.fail('An error occurred fetching members!'));
        }

        const discrims = members
            .filter(member => member.user.discriminator === args[0])
            .array();

        let cached: Collection<string, GuildMember>;
        try {
            cached = await message.guild.members.fetch({ user: discrims.map(member => member.id) });
        } catch {
            return message.channel.send(this.Embed.fail('An error occurred fetching users!'));
        }

        const formatted = Array.from(cached.values()).map(member => `\`\`${member.user.tag}\`\``);
        const embed = this.Embed.success()
            .setDescription(`
            Found **${formatted.length}** user${formatted.length === 1 ? '' : 's'}!
            ${formatted.join(', ')}
            `.slice(0, 2048))
            .setFooter('Requested by ' + message.author.tag, message.author.displayAvatarURL())
            .setTimestamp();

        return message.channel.send(embed);
    }
}