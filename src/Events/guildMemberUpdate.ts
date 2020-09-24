import { Event } from "../Structures/Event";
import { ClientEvents, GuildMember, TextChannel, Permissions } from "discord.js";
import { pool } from "../Structures/Database/Mongo";
import { GuildSettings } from "../lib/types/Collections";
import { Logger } from "../Structures/Logger";
import { Command } from '../Structures/Command';
import { inspect } from "util";

const Embed = Command.Embed;

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

export default class implements Event {
    name: keyof ClientEvents = 'guildMemberUpdate';
    logger = new Logger(this.name);

    async init(oldMember: GuildMember, newMember: GuildMember) {
        this.logger.log(`${inspect(oldMember)}\n${inspect(newMember)}\n\n\n`); // temporary until I confirm it works

        const oldRoles = oldMember.roles.cache.filter(r => r.managed);
        const newRoles = newMember.roles.cache.filter(r => r.managed);

        if(oldRoles.size === newRoles.size) {
            return;
        } else if((!oldMember.premiumSince && !newMember.premiumSince) || oldMember.premiumSince && newMember.premiumSince) { // both either have or don't have
            return;
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        const guild = await collection.findOne({ id: oldMember.guild.id }) as GuildSettings;

        if(!guild?.welcomeChannel) {
            return;
        }

        let channel: TextChannel;
        try {
            channel = await oldMember.guild.me.client.channels.fetch(guild.welcomeChannel) as TextChannel;
        } catch {
            return;
        }

        if(!['text', 'news'].includes(channel.type)) {
            return;
        } else if(!channel.permissionsFor(oldMember.guild.me).has(basic)) {
            return;
        }

        if(oldRoles.size > newRoles.size && oldMember.premiumSince && !newMember.premiumSince) { // lost role
            return channel.send(Embed.fail(`
            ${newMember} is no longer boosting the server! 😨
            `));
        } else if(oldRoles.size < newRoles.size && !oldMember.premiumSince && newMember.premiumSince) { // gained role
            return channel.send(Embed.success(`
            ${newMember} just boosted the server! 🥳
            `));
        }
    }
}