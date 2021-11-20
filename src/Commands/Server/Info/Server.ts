import { Command } from '../../../Structures/Command.js';
import { bold, inlineCode, italic, time } from '@khaf/builders';
import { Message } from '../../../lib/types/Discord.js.js';

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
            ${italic(message.guild.name)}
            ${inlineCode(message.guild.description ?? 'No description set')}
            `)
            .addFields(
                { name: bold('ID:'), value: message.guild.id, inline: true },
                { name: bold('Verified:'), value: message.guild.verified ? 'Yes' : 'No', inline: true },
                { name: bold('Partnered:'), value: message.guild.partnered ? 'Yes' : 'No', inline: true },
                { name: bold('Members:'), value: message.guild.memberCount.toLocaleString(locale), inline: true },
                { name: bold('Owner:'), value: `<@!${message.guild.ownerId}>`, inline: true },
                { name: bold('Boosts:'), value: message.guild.premiumSubscriptionCount?.toLocaleString(locale) ?? 'None', inline: true },
                { name: bold('Tier:'), value: `${message.guild.premiumTier}`, inline: true },
                { name: bold('Vanity URL:'), value: message.guild.vanityURLCode ? `https://discord.gg/${message.guild.vanityURLCode}` : 'None', inline: true },
                { name: bold('Verification:'), value: message.guild.verificationLevel, inline: true },
                { name: bold('Created:'), value: time(message.guild.createdAt), inline: false }
            );
    }
}