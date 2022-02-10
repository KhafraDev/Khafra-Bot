import { Command } from '#khaf/Command';
import { bold, inlineCode, italic, time, type Embed } from '@khaf/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
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

    async init (message: Message<true>): Promise<Embed> { 
        const locale = message.guild.preferredLocale;

        return this.Embed.ok()
            .setAuthor({
                name: message.client.user!.username,
                iconURL: message.client.user!.displayAvatarURL()
            })
            .setTimestamp()
            .setThumbnail(message.guild.bannerURL())
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
                { name: bold('Verification:'), value: `Level ${message.guild.verificationLevel}`, inline: true },
                { name: bold('Created:'), value: time(message.guild.createdAt), inline: false }
            );
    }
}