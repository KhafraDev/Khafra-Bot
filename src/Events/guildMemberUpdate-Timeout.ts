import { cache } from '#khaf/cache/Settings.js';
import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import type { kGuild, PartialGuild } from '#khaf/types/KhafraBot';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText } from '#khaf/utility/Discord.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { ellipsis } from '#khaf/utility/String.js';
import { bold, inlineCode, time } from '@discordjs/builders';
import { AuditLogEvent } from 'discord-api-types/v10';
import { Events, PermissionFlagsBits, type AnyChannel, type GuildAuditLogsEntry, type GuildMember } from 'discord.js';
import { setTimeout } from 'node:timers/promises';

const auditLogPerms = PermissionFlagsBits.ViewAuditLog;
const basic =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks;

type LogChannel = Pick<kGuild, keyof PartialGuild>;

export class kEvent extends Event<typeof Events.GuildMemberUpdate> {
    name = Events.GuildMemberUpdate;

    async init (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
        const old = oldMember.communicationDisabledUntil;
        const current = newMember.communicationDisabledUntil;

        if (old === current || old?.getTime() === current?.getTime()) {
            return;
        }

        const row = cache.get(oldMember.guild.id);
        let item: LogChannel | null = row ?? null;

        if (!item) {
            const rows = await sql<kGuild[]>`
                SELECT
                    mod_log_channel, max_warning_points,
                    welcome_channel, ticketChannel, "staffChannel"
                FROM kbGuild
                WHERE guild_id = ${oldMember.guild.id}::text
                LIMIT 1;
            `;

            if (rows.length !== 0) {
                cache.set(oldMember.guild.id, rows[0]);
                item = rows[0];
            } else {
                return;
            }
        }

        const logChannel = item.mod_log_channel;
        const self = oldMember.guild.members.me ?? newMember.guild.members.me;
        let channel: AnyChannel | null = null;
        let muted: GuildAuditLogsEntry<AuditLogEvent.MemberUpdate> | undefined;

        if (logChannel === null) {
            return;
        } else if (oldMember.guild.channels.cache.has(logChannel)) {
            channel = oldMember.guild.channels.cache.get(logChannel) ?? null;
        } else if (self) {
            const chan = await self.client.channels.fetch(logChannel);
            channel = chan;
        }

        if (self === null || !isText(channel) || !hasPerms(channel, self, basic)) {
            return;
        }

        if (self.permissions.has(auditLogPerms)) {
            for (let i = 0; i < 5; i++) {
                const logs = await oldMember.guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberUpdate,
                    limit: 5
                });

                muted = logs.entries.find((entry) => entry.target?.id === oldMember.id);

                if (muted) {
                    break;
                }

                await setTimeout(2_000);
            }
        }

        await channel.send({
            embeds: [
                Embed.json({
                    color: colors.ok,
                    description: `
                    ${bold('User:')} ${oldMember} (${oldMember.user.tag})
                    ${bold('ID:')} ${oldMember.id}
                    ${bold('Staff:')} ${muted?.executor ?? 'Unknown'}
                    ${bold('Until:')} ${time(current!, 'F')}
                    ${bold('Reason:')} ${inlineCode(ellipsis(muted?.reason ?? 'Unknown', 1500))}`,
                    title: 'Member Muted'
                })
            ]
        });
    }
}