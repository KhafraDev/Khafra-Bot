import { cache } from '#khaf/cache/Settings.js';
import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import type { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { AnyChannel, GuildMember } from 'discord.js';

const basic =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks;

type WelcomeChannel = Pick<kGuild, keyof PartialGuild>;

export class kEvent extends Event<'guildMemberUpdate'> {
    name = 'guildMemberUpdate' as const;

    async init (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
        // https://discord.js.org/#/docs/main/master/class/RoleManager?scrollTo=premiumSubscriberRole
        const premiumRole = oldMember.roles.premiumSubscriberRole;
        if (!premiumRole) return;

        const oldHas = oldMember.roles.cache.has(premiumRole.id);
        const newHas = newMember.roles.cache.has(premiumRole.id);

        // both either have or don't have the role
        if (oldHas === newHas)
            return;

        const row = cache.get(oldMember.guild.id);
        let item: WelcomeChannel | null = row ?? null;

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

        if (item.welcome_channel === null) return;

        let channel: AnyChannel | null = null;
        if (oldMember.guild.channels.cache.has(item.welcome_channel)) {
            channel = oldMember.guild.channels.cache.get(item.welcome_channel) ?? null;
        } else {
            const [err, chan] = await dontThrow(oldMember.guild.me!.client.channels.fetch(item.welcome_channel));
            if (err !== null) return;
            channel = chan;
        }

        if (!isText(channel) || !hasPerms(channel, oldMember.guild.me, basic))
            return;

        if (oldHas && !newHas) { // lost role
            const embed = Embed.error(`${newMember} is no longer boosting the server! 😨`)
                .setColor(colors.boost)
                .setAuthor({
                    name: newMember.user.username,
                    iconURL: newMember.user.displayAvatarURL()
                });

            return void dontThrow(channel.send({ embeds: [embed] }));
        } else { // gained role
            const embed = Embed.ok(`${newMember} just boosted the server! 🥳`)
                .setAuthor({
                    name: newMember.user.username,
                    iconURL: newMember.user.displayAvatarURL()
                });

            return void dontThrow(channel.send({ embeds: [embed] }));
        }
    }
}