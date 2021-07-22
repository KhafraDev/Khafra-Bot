import { Event } from '../../Structures/Event.js';
import { RegisterEvent } from '../../Structures/Decorator.js';
import { Permissions, Channel, GuildChannel } from 'discord.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { isDM, isExplicitText, isStage, isText, isVoice } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { bold } from '@discordjs/builders';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

type LogChannel = Pick<kGuild, 'complete_log_channel'>;

const yes = (y: boolean) => y ? 'Yes' : 'No';

@RegisterEvent
export class kEvent extends Event<'channelUpdate'> {
    name = 'channelUpdate' as const;

    async init(oldChannel: GuildChannel, newChannel: GuildChannel) {
        if (isDM(oldChannel) || isDM(newChannel)) return;
        if (
            oldChannel.deletable !== newChannel.deletable ||
            oldChannel.manageable !== newChannel.manageable ||
            oldChannel.viewable !== newChannel.viewable ||
            oldChannel.deleted !== newChannel.deleted ||
            oldChannel.type !== newChannel.type
        ) {
            return;
        }

        const cached = await client.exists(oldChannel.guild.id) === 1;
        let item: LogChannel | null = null;

        if (cached) {
            item = JSON.parse(await client.get(oldChannel.guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<LogChannel>(`
                SELECT complete_log_channel FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [oldChannel.guild.id]);

            void client.set(oldChannel.guild.id, JSON.stringify(rows[0]), 'EX', 600);
            item = rows[0];
        }

        let logChannel: Channel | null = null;
        if (oldChannel.guild.channels.cache.has(item.complete_log_channel)) {
            logChannel = oldChannel.guild.channels.cache.get(item.complete_log_channel);
        } else {
            const [err, chan] = await dontThrow(oldChannel.guild.client.channels.fetch(item.complete_log_channel));
            if (err !== null) return;
            logChannel = chan;
        }

        if (!isText(logChannel) || !hasPerms(logChannel, oldChannel.guild.me, basic))
            return;

        const embed = Embed.success(`${newChannel}`)
            .setTitle('Channel Updated');

        if (oldChannel.name !== newChannel.name)
            embed.addField(bold('Name:'), `${oldChannel.name} -> ${newChannel.name}`, true);
        
        if (oldChannel.parentId !== newChannel.parentId)
            embed.addField(bold('Parent:'), `${oldChannel.parent} -> ${newChannel.parent}`, true);

        if (oldChannel.position !== newChannel.position)
            embed.addField(bold('Position:'), `${oldChannel.position} -> ${newChannel.position}`, true);

        if (oldChannel.permissionsLocked !== newChannel.permissionsLocked)
            embed.addField(bold('Perms Locked:'), `${yes(oldChannel.permissionsLocked)} -> ${yes(newChannel.permissionsLocked)}`, true);

        // https://discord.js.org/#/docs/main/master/class/GuildChannel
        if (isText(oldChannel) && isText(newChannel)) {
            if (oldChannel.nsfw !== newChannel.nsfw)
                embed.addField(bold('NSFW:'), `${yes(oldChannel.nsfw)} -> ${yes(newChannel.nsfw)}`, true);

            if (oldChannel.topic !== newChannel.topic)
                embed.addField(
                    bold('Topic:'), 
                    `${oldChannel.topic?.slice(0, 500) ?? 'None'} -> ${newChannel.topic?.slice(0, 500) ?? 'None'}`, 
                    true
                );

            if (isExplicitText(oldChannel) && isExplicitText(newChannel)) {
                if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser)
                    embed.addField(bold('Rate-Limit:'), `${oldChannel.rateLimitPerUser}ms -> ${newChannel.rateLimitPerUser}ms`, true);
            }
        } else if (isVoice(oldChannel) && isVoice(newChannel) || isStage(oldChannel) && isStage(newChannel)) {
            if (oldChannel.bitrate !== newChannel.bitrate)
                embed.addField(bold('Bitrate:'), `${oldChannel.bitrate} -> ${newChannel.bitrate}`, true);

            if (oldChannel.full !== newChannel.full) // ?
                embed.addField(bold('Full:'), `${yes(oldChannel.full)} -> ${yes(newChannel.full)}`, true);

            if (oldChannel.rtcRegion !== newChannel.rtcRegion)
                embed.addField(bold('RTC Region:'), `${oldChannel.rtcRegion ?? 'Auto'} -> ${newChannel.rtcRegion ?? 'Auto'}`, true);

            if (oldChannel.userLimit !== newChannel.userLimit)
                embed.addField(bold('User Limit:'), `${oldChannel.userLimit} -> ${newChannel.userLimit}`, true);
        }

        if (embed.fields.length === 0)
            return;

        return dontThrow(logChannel.send({ embeds: [embed] }));
    }
}