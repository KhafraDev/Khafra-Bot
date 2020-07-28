import { Event } from "../Structures/Event";
import { MessageReaction, User, PartialUser, PermissionString } from "discord.js";
import { dbHelpers } from "../Backend/Helpers/GuildSettings";

export default class extends Event {
    constructor() {
        super('messageReactionRemove');
    }

    async init(reaction: MessageReaction, user: User | PartialUser) {
        if(reaction.partial) {
            await reaction.fetch();
        }
    
        if(reaction.message.deleted) {
            return;
        }
    
        if(user.partial) {
            await user.fetch();
        }
    
        const perms = reaction.message.guild.me.permissionsIn(reaction.message.channel);
        const needed = [
            'READ_MESSAGE_HISTORY',
            'MANAGE_ROLES' // not sure if required
        ] as PermissionString[];
        
        if(user.id === reaction.message.client.user.id) {
            return;
        } else if(!needed.every(perm => perms.has(perm))) {
            return;
        }
    
        const guildSettings = dbHelpers.get(reaction.message.guild.id, 'react_messages');
        if(!guildSettings) {
            return;
        }
    
        const filtered = guildSettings.react_messages.filter(r => {
            const emoji = (reaction.message.client.emojis.resolve(r.emoji) ?? r.emoji) as any;
            if(
                (emoji === r.emoji || emoji?.id === r.emoji) && // Emoji is the same
                r.id === reaction.message.id                    // message id is the same
            ) {
                return r;
            }
        });
    
        if(filtered.length === 0) {
            return;
        }
    
        // member MUST be fetched or they will never be manageable!
        const member = await reaction.message.guild.members.fetch(user.id);
        if(member.manageable) {    
            return member.roles.remove(filtered[0].role, 'Reacted');
        }
    }
}