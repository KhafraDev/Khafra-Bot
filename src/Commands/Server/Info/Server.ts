import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { time } from '@discordjs/builders';
import { Message } from '../../../lib/types/Discord.js.js';

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
                aliases: [ 'serverinfo', 'guildinfo', 'guild' ],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    init(message: Message) { 
        const locale = message.guild.preferredLocale;

        return this.Embed.success()
            .setAuthor(message.client.user!.username, message.client.user!.displayAvatarURL())
            .setTimestamp()
            .setThumbnail(message.guild.bannerURL()!)
            .setDescription(`
            *${message.guild.name}*
            \`\`${message.guild.description?.length ? message.guild.description : 'No description set'}\`\`
            `)
            .addFields(
                { name: '**ID:**', value: message.guild.id, inline: true },
                { name: '**Verified:**', value: message.guild.verified ? 'Yes' : 'No', inline: true },
                { name: '**Partnered:**', value: message.guild.partnered ? 'Yes' : 'No', inline: true },
                { name: '**Members:**', value: message.guild.memberCount.toLocaleString(locale), inline: true },
                { name: '**Owner:**', value: `<@!${message.guild.ownerId}>`, inline: true },
                { name: '**Boosts:**', value: message.guild.premiumSubscriptionCount?.toLocaleString(locale) ?? 'None', inline: true },
                { name: '**Tier:**', value: `${message.guild.premiumTier}`, inline: true },
                { name: '**Vanity URL:**', value: message.guild.vanityURLCode ? `https://discord.gg/${message.guild.vanityURLCode}` : 'None', inline: true },
                { name: '**Verification:**', value: message.guild.verificationLevel, inline: true },
                { name: '**Created:**', value: time(message.guild.createdAt), inline: false }
            );
    }
}