import { Event } from "../Structures/Event";
import { 
    MessageReaction, 
    User, 
    PartialUser, 
    ClientEvents, 
    Permissions 
} from "discord.js";
import Embed from "../Structures/Embed";
import { pool } from "../Structures/Database/Mongo";
import { GuildSettings } from "../lib/types/Collections";
import { Logger } from "../Structures/Logger";

const cache: Map<string, number> = new Map();

export default class implements Event {
    name: keyof ClientEvents = 'messageReactionRemove';
    logger = new Logger(this.name);

    async init(reaction: MessageReaction, user: User | PartialUser) {
        if(reaction.partial) {
            try {
                await reaction.fetch();
            } catch(e) {
                this.logger.log(e.toString());
                return;
            }
        }
    
        // dm channel or guild isn't available
        if(reaction.message.channel.type === 'dm' || !reaction.message.guild.available) {
            return;
        }
    
        if(user.partial) {
            await user.fetch();
        }
    
        const perms = reaction.message.guild.me.permissionsIn(reaction.message.channel);
        const needed = new Permissions([
            'READ_MESSAGE_HISTORY',
            'MANAGE_ROLES',
            'VIEW_CHANNEL'
        ]);
        
        if(user.id === reaction.message.client.user.id || user.bot) {
            return;
        } else if(!perms.has(needed)) {
            return;
        }      
        
        const cached = cache.get(reaction.message.author.id);
        if(cached) {
            if((Date.now() - cached) / 1000 / 60 < 1) { // user reacted within the last minute
                return;
            }
        } else {
            cache.set(reaction.message.author.id, Date.now());
        }
    
        // member MUST be fetched or they will never be manageable!
        const member = await reaction.message.guild.members.fetch(user.id); 
        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        const guild = await collection.findOne({
            $and: [
                { id: reaction.message.guild.id },
                { 'roleReacts.message': {
                    $eq: reaction.message.id
                } },
                { 'roleReacts.emoji': {
                    $eq: reaction.emoji.name
                } }
            ]
        }) as GuildSettings;
            
        if(!guild) { // no react role found
            return;
        } else if(guild && !member.manageable) {
            this.logger.log(`
                Action: ${this.name}
                | URL: ${reaction.message.url} 
                | Guild: ${reaction.message.guild.id} 
                | Failed: Not manageable
            `.split(/\n\r|\n|\r/g).map(e => e.trim()).join(' ').trim());
            // valid react role but member isn't manageable
            try {
                return member.send(Embed.fail('I can\'t manage your roles. Please ask an admin to update my perms. 🙏'));
            } catch {}
        }
        
        const filtered = guild.roleReacts.filter(r =>
            r.message === reaction.message.id && r.emoji === reaction.emoji.name
        ).shift();
        this.logger.log(`
            Action: ${this.name} 
            | URL: ${reaction.message.url} 
            | Guild: ${reaction.message.guild.id} 
            | Role: ${filtered.role}
        `.split(/\n\r|\n|\r/g).map(e => e.trim()).join(' ').trim());
        try {
            return member.roles.remove(filtered.role, 'Khafra-Bot: reacted to ' + filtered.message);
        } catch {}
    }
}