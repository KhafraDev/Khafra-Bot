import { Event } from "../Structures/Event";
import { 
    MessageReaction, 
    User, 
    PartialUser, 
    PermissionString, 
    ClientEvents 
} from "discord.js";
import Embed from "../Structures/Embed";
import { pool } from "../Structures/Database/Mongo";
import { GuildSettings } from "../lib/types/Collections";

export default class implements Event {
    name: keyof ClientEvents = 'messageReactionAdd';

    async init(reaction: MessageReaction, user: User | PartialUser) {
        if(reaction.partial) {
            await reaction.fetch();
        }
    
        // dm channel or guild isn't available
        if(!reaction.message.guild || !reaction.message.guild.available) {
            return;
        }
    
        if(user.partial) {
            await user.fetch();
        }
    
        const perms = reaction.message.guild.me.permissionsIn(reaction.message.channel);
        const needed = [
            'READ_MESSAGE_HISTORY',
            'MANAGE_ROLES',
            'VIEW_CHANNEL',
        ] as PermissionString[];
        
        if(user.id === reaction.message.client.user.id || user.bot) {
            return;
        } else if(!needed.every(perm => perms.has(perm))) {
            return;
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
            console.log(reaction.message.guild.id, ' not found!');
            return;
        } else if(guild && !member.manageable) {
            // valid react role but member isn't manageable
            try {
                return member.send(Embed.fail('I can\'t manage your roles. Please ask an admin to update my perms. 🙏'));
            } catch {}
        }
        
        const filtered = (guild.roleReacts as any[]).filter((r: { message: string; emoji: string; }) =>
            r.message === reaction.message.id && r.emoji === reaction.emoji.name
        ).shift();
        try {
            return member.roles.add(filtered.role, 'Khafra-Bot: reacted to ' + filtered.message);
        } catch {}
    }
}