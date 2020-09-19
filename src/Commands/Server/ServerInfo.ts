import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';
import Embed from '../../Structures/Embed';
import { formatDate } from '../../lib/Utility/Date';

export default class extends Command {
    constructor() {
        super(
            [
                'Get info about the server!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'server',
                folder: 'Server',
                aliases: [ 'serverinfo', 'guildinfo' ],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    init(message: Message) {        
        const embed = Embed.success()
            .setAuthor(message.client.user.username, message.client.user.displayAvatarURL())
            .setTimestamp()
            .setThumbnail(message.guild.bannerURL())
            .setDescription(`
            *${message.guild.name}*
            \`\`${message.guild.description?.length ? message.guild.description : 'No description set'}\`\`
            `)
            .addFields(
                { name: '**ID:**', value: message.guild.id, inline: true },
                { name: '**Large:**', value: message.guild.large ? 'Yes' : 'No', inline: true },
                { name: '**Members:**', value: message.guild.memberCount.toLocaleString(), inline: true },
                { name: '**Owner:**', value: message.guild.owner.toString(), inline: true },
                { name: '**Boosts:**', value: message.guild.premiumSubscriptionCount.toLocaleString(), inline: true },
                { name: '**Tier:**', value: message.guild.premiumTier, inline: true },
                { name: '**Region:**', value: message.guild.region, inline: true },
                { name: '**Vanity URL:**', value: message.guild.vanityURLCode ? `https://discord.gg/${message.guild.vanityURLCode}` : 'None', inline: true },
                { name: '**Verification:**', value: message.guild.verificationLevel, inline: true },
                { name: '**Created:**', value: formatDate('MMMM Do, YYYY hh:mm:ss A t', message.guild.createdAt), inline: false }
            );

        return message.channel.send(embed);
    }
}