import { cache } from '#khaf/cache/Settings.js'
import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import type { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isTextBased } from '#khaf/utility/Discord.js'
import { time } from '@discordjs/builders'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { Events, type GuildMember } from 'discord.js'

const basic =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks

type WelcomeChannel = Pick<kGuild, keyof PartialGuild>

export class kEvent extends Event<typeof Events.GuildMemberAdd> {
    name = Events.GuildMemberAdd as const

    async init (member: GuildMember): Promise<void> {
        await sql`
            INSERT INTO kbInsights (
                k_guild_id, k_joined
            ) VALUES (
                ${member.guild.id}::text, ${1}::integer
            ) ON CONFLICT (k_guild_id, k_date) DO UPDATE SET
                k_joined = kbInsights.k_joined + 1
                WHERE kbInsights.k_guild_id = ${member.guild.id}::text;
        `

        const row = cache.get(member.guild.id)
        let item: WelcomeChannel | null = row ?? null

        if (!item) {
            const rows = await sql<kGuild[]>`
                SELECT
                    mod_log_channel, max_warning_points,
                    welcome_channel, ticketChannel, "staffChannel"
                FROM kbGuild
                WHERE guild_id = ${member.guild.id}::text
                LIMIT 1;
            `

            if (rows.length !== 0) {
                cache.set(member.guild.id, rows[0])
                item = rows[0]
            } else {
                return
            }
        }

        if (item.welcome_channel === null) {
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

        const embed = Embed.json({
            color: colors.ok,
            author: { name: member.user.username, icon_url: member.user.displayAvatarURL() },
            description: `
            ${member} (${member.user.tag}) joined the server!
            • Account Created: ${time(member.user.createdAt)} (${time(member.user.createdAt, 'R')})
            • Joined: ${time(member.joinedAt!)} (${time(member.joinedAt!, 'R')})`,
            footer: { text: 'User joined' }
        })

        await channel.send({ embeds: [embed] })
    }
}