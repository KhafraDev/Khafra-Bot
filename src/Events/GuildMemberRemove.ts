import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { isTextBased } from '#khaf/utility/Discord.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { time } from '@discordjs/builders'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { Events, type GuildMember } from 'discord.js'
import { join } from 'node:path'

type kGuildWelcomeChannel = Pick<kGuild, 'welcome_channel'>

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'))

const basic =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks

export class kEvent extends Event<typeof Events.GuildMemberRemove> {
    name = Events.GuildMemberRemove as const

    async init (member: GuildMember): Promise<void> {
        if (member.id === config.botId) {
            return
        }

        await sql`
            INSERT INTO kbInsights (
                k_guild_id, k_left
            ) VALUES (
                ${member.guild.id}::text, ${1}::integer
            ) ON CONFLICT (k_guild_id, k_date) DO UPDATE SET
                k_left = kbInsights.k_left + 1
                WHERE kbInsights.k_guild_id = ${member.guild.id}::text;
        `

        const [item] = await sql<[kGuildWelcomeChannel?]>`
            SELECT welcome_channel
            FROM kbGuild
            WHERE guild_id = ${member.guild.id}::text
            LIMIT 1;
        `


        if (!item?.welcome_channel) {
            return
        }

        const channel = await member.guild.channels.fetch(item.welcome_channel)
        const me = member.guild.members.me

        if (
            channel === null ||
            me === null ||
            !isTextBased(channel) ||
            !channel.permissionsFor(me).has(basic)
        ) {
            return
        }

        const joined =
            (member.joinedAt ? time(member.joinedAt) : 'N/A') +
            ` (${member.joinedAt ? time(member.joinedAt, 'R') : 'N/A'})`

        const embed = Embed.json({
            color: colors.ok,
            author: { name: member.user.username, icon_url: member.user.displayAvatarURL() },
            description: `
            ${member} (${member.user.tag}) has left the server!
            • Account Created: ${time(member.user.createdAt)} (${time(member.user.createdAt, 'R')})
            • Joined: ${joined}
            • Left: ${time(new Date())} (${time(new Date(), 'R')})`,
            footer: { text: 'User left' }
        })

        await channel.send({ embeds: [embed] })
    }
}