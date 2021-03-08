import { Event } from '../Structures/Event.js';
import { GuildMember, TextChannel, Permissions } from 'discord.js';
import { pool } from '../Structures/Database/Mongo.js';
import { GuildSettings } from '../lib/types/Collections';
import { isText } from '../lib/types/Discord.js.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { RegisterEvent } from '../Structures/Decorator.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

@RegisterEvent
export class kEvent extends Event {
    name = 'guildMemberUpdate' as const;

    async init(oldMember: GuildMember, newMember: GuildMember) {
        if ((!oldMember.premiumSince && !newMember.premiumSince) || oldMember.premiumSince && newMember.premiumSince) { // both either have or don't have
            return;
        }

        const oldRoles = oldMember.roles.cache.filter(r => r.managed).size;
        const newRoles = newMember.roles.cache.filter(r => r.managed).size;

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        const guild = await collection.findOne<GuildSettings>({ id: oldMember.guild.id });

        if (!guild?.welcomeChannel) {
            return;
        }

        let channel: TextChannel;
        try {
            channel = await oldMember.guild.me.client.channels.fetch(guild.welcomeChannel) as TextChannel;
        } catch {
            return;
        }

        if (!isText(channel) || !hasPerms(channel, oldMember.guild.me, basic)) 
            return;

        if (oldRoles > newRoles) { // lost role
            return channel.send(Embed.fail(`
            ${newMember} is no longer boosting the server! 😨
            `));
        } else if (newRoles > oldRoles) { // gained role
            return channel.send(Embed.success(`
            ${newMember} just boosted the server! 🥳
            `));
        } else { // other servers?
            return channel.send(Embed.success(`
            ${!oldMember.premiumSince && newMember.premiumSince ? `${newMember} boosted a server.` : `${newMember} stopped boosting a server.`}
            `));
        }
    }
}