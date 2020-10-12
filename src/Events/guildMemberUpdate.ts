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
        if((!oldMember.premiumSince && !newMember.premiumSince) || oldMember.premiumSince && newMember.premiumSince) { // both either have or don't have
            return;
        }

        const oldRoles = oldMember.roles.cache.filter(r => r.managed).size;
        const newRoles = newMember.roles.cache.filter(r => r.managed).size;
        this.logger.log(`${inspect(oldMember)}\n${inspect(newMember)}\n\n\n`); // temporary until I confirm it works

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        const guild = await collection.findOne<GuildSettings>({ id: oldMember.guild.id });

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

        if(oldRoles > newRoles) { // lost role
            return channel.send(Embed.fail(`
            ${newMember} is no longer boosting the server! 😨
            `));
        } else if(newRoles > oldRoles) { // gained role
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