import { Event } from '../Structures/Event.js';
import { GuildMember, Channel, Permissions, Snowflake } from 'discord.js';
import { isText } from '../lib/types/Discord.js.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { pool } from '../Structures/Database/Postgres.js';
import { client } from '../Structures/Database/Redis.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

@RegisterEvent
export class kEvent extends Event {
    name = 'guildMemberUpdate' as const;

    async init(oldMember: GuildMember, newMember: GuildMember) {
        // https://discord.js.org/#/docs/main/master/class/RoleManager?scrollTo=premiumSubscriberRole
        const premiumRole = oldMember.roles.premiumSubscriberRole;
        if (!premiumRole) return;
        
        const oldHas = oldMember.roles.cache.has(premiumRole.id);
        const newHas = newMember.roles.cache.has(premiumRole.id);

        // both either have or don't have the role
        if (oldHas === newHas)
            return;

        const cached = await client.exists(oldMember.guild.id) === 1;
        let item: { welcome_channel: Snowflake } | null = null

        if (cached) {
            item = JSON.parse(await client.get(oldMember.guild.id));
        } else {
            const { rows } = await pool.query<{ welcome_channel: Snowflake }>(`
                SELECT welcome_channel
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [oldMember.guild.id]);
            
            item = rows[0];
        }

        if (!item || item.welcome_channel === null) return;

        let channel: Channel;
        if (oldMember.guild.channels.cache.has(item.welcome_channel)) {
            channel = oldMember.guild.channels.cache.get(item.welcome_channel)!;
        } else {
            try {
                channel = await oldMember.guild.me.client.channels.fetch(item.welcome_channel);
            } catch {
                return;
            }
        }

        if (!isText(channel) || !hasPerms(channel, oldMember.guild.me, basic)) 
            return;

        if (oldHas && !newHas) { // lost role
            return channel.send({ embed: Embed.fail(`
            ${newMember} is no longer boosting the server! 😨
            `) }).catch(() => {});
        } else { // gained role
            return channel.send({ embed: Embed.success(`
            ${newMember} just boosted the server! 🥳
            `) }).catch(() => {});
        }
    }
}