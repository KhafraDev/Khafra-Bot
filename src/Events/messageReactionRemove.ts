import { Event } from '../Structures/Event.js';
import { 
    MessageReaction, 
    User, 
    PartialUser, 
    ClientEvents, 
    Permissions 
} from "discord.js";
import { pool } from '../Structures/Database/Mongo.js';
import { GuildSettings } from '../lib/types/Collections';
import { Logger } from '../Structures/Logger.js';
import { Command } from '../Structures/Command.js';
import { trim } from '../lib/Utility/Template.js';
import { client as Client } from '../index.js';
import { isDM } from '../lib/types/Discord.js.js';

const Embed = Command.Embed;
const cache: Map<string, number> = new Map();
const basic = new Permissions([
    'READ_MESSAGE_HISTORY',
    'MANAGE_ROLES',
    'VIEW_CHANNEL'
]);

export default class implements Event {
    name: keyof ClientEvents = 'messageReactionRemove';
    logger = new Logger(this.name);

    async init(reaction: MessageReaction, user: User | PartialUser) {
        // in partial messages, we are given the message (including the guild)
        // but not the client user. Message#member and Message#author can be null
    
        // dm channel or guild isn't available
        if(isDM(reaction.message.channel) || !reaction.message.guild.available) {
            return;
        }
    
        const perms = reaction.message.guild.me.permissionsIn(reaction.message.channel);
        if(user.id === Client.user.id || user.bot) {
            return;
        } else if(!perms.has(basic)) {
            return;
        }    
        
        const cached = cache.get(user.id);
        if(cached) {
            if((Date.now() - cached) / 1000 / 60 < 1) { // user reacted within the last minute
                return;
            } else {
                cache.delete(user.id);
            }
        } else {
            cache.set(user.id, Date.now());
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        const guild = await collection.findOne<GuildSettings>({
            $and: [
                { id: reaction.message.guild.id },
                { 'roleReacts.message': {
                    $eq: reaction.message.id
                } },
                { 'roleReacts.emoji': {
                    $eq: reaction.emoji.name
                } }
            ]
        });
            
        if(!guild) { // no react role found
            return;
        } 

        const filtered = guild.roleReacts.filter(r =>
            r.message === reaction.message.id && r.emoji === reaction.emoji.name
        ).shift();
        
        this.logger.log(trim`
            Action: ${this.name}
            | URL: ${reaction.message.url} 
            | Guild: ${reaction.message.guild.id} 
            | ${!reaction.message.member?.manageable ? 'Failed: Not manageable' : `Role: ${filtered.role ?? 'None'}`}
        `);

        if(!filtered) {
            return;
        }

        let member;
        try {
            if(reaction.message.member && !reaction.message.member.partial) {
                member = reaction.message.member;
            } else {
                member = await reaction.message.guild.members.fetch(user.id);
            }
        } catch {
            return;
        }

        if(!member.manageable) {
            try {
                return user.send(Embed.fail('I can\'t manage your roles. Please ask an admin to update my perms. 🙏'));
            } catch {
                return;
            }
        } else if(member.roles.cache.has(filtered.role)) {
            return;
        }
        
        try {
            return member.roles.remove(filtered.role, 'Khafra-Bot: reacted to ' + filtered.message);
        } catch {}
    }
}