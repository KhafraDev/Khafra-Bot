import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold, hyperlink, inlineCode, italic, time } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get info about the server!'
            ],
            {
                name: 'server',
                folder: 'Server',
                aliases: ['serverinfo', 'guildinfo', 'guild'],
                args: [0, 0],
                guildOnly: true
            }
        )
    }

    async init (message: Message<true>): Promise<APIEmbed> {
        const locale = message.guild.preferredLocale

        return Embed.json({
            color: colors.ok,
            author: {
                name: message.client.user!.username,
                icon_url: message.client.user!.displayAvatarURL()
            },
            timestamp: new Date().toISOString(),
            thumbnail: message.guild.icon ? { url: message.guild.iconURL()! } : undefined,
            description: `${italic(message.guild.name)}
            ${inlineCode(message.guild.description ?? 'No description set')}

            ${message.guild.icon ? hyperlink('Server icon', message.guild.iconURL()!) : ''}
            ${message.guild.banner ? hyperlink('Server banner', message.guild.bannerURL()!) : ''}`,
            fields: [
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
            ]
        })
    }
}