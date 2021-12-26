import { Event } from '#khaf/Event';
import { GuildMember, Permissions, AnyChannel } from 'discord.js';
import { isText } from '../lib/types/Discord.js.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { defaultKGuild, pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';
import { kGuild, PartialGuild } from '../lib/types/KhafraBot.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

type WelcomeChannel = Pick<kGuild, keyof PartialGuild>;

export class kEvent extends Event<'guildMemberUpdate'> {
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

        const row = await client.get(oldMember.guild.id);
        let item: WelcomeChannel = JSON.parse(row!) as kGuild;

        if (!item) {
            const { rows } = await pool.query<WelcomeChannel>(`
                SELECT ${defaultKGuild}
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [oldMember.guild.id]);
            
            if (rows.length !== 0) {
                void client.set(oldMember.guild.id, JSON.stringify(rows[0]), 'EX', 600);
                item = rows[0];
            }
        }

        if (!item || item.welcome_channel === null) return;

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
            const embed = Embed.error(`${newMember} is no longer boosting the server! 😨`);
            if (newMember.user)
                embed.setAuthor({
                    name: newMember.user.username,
                    iconURL: newMember.user.displayAvatarURL()
                });

            return dontThrow(channel.send({ embeds: [embed] }));
        } else { // gained role
            const embed = Embed.ok(`${newMember} just boosted the server! 🥳`);
            if (newMember.user)
                embed.setAuthor({
                    name: newMember.user.username,
                    iconURL: newMember.user.displayAvatarURL()
                });

            return dontThrow(channel.send({ embeds: [embed] }));
        }
    }
}