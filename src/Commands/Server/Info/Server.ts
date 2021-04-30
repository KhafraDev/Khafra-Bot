import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { formatDate } from '../../../lib/Utility/Date.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get info about the server!'
            ],
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
        return this.Embed.success()
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
                { name: '**Owner:**', value: `<@!${message.guild.ownerID}>`, inline: true },
                { name: '**Boosts:**', value: message.guild.premiumSubscriptionCount.toLocaleString(), inline: true },
                { name: '**Tier:**', value: message.guild.premiumTier, inline: true },
                { name: '**Region:**', value: message.guild.region, inline: true },
                { name: '**Vanity URL:**', value: message.guild.vanityURLCode ? `https://discord.gg/${message.guild.vanityURLCode}` : 'None', inline: true },
                { name: '**Verification:**', value: message.guild.verificationLevel, inline: true },
                { name: '**Created:**', value: formatDate('MMMM Do, YYYY hh:mm:ss A t', message.guild.createdAt), inline: false }
            );
    }
}