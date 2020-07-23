import { Event } from "../Structures/Event";
import { MessageReaction, User, PartialUser } from "discord.js";
import { dbHelpers, react_messages } from "../Helpers/GuildSettings";

export default class extends Event {
    constructor() {
        super('messageReactionRemove');
    }

    async init(reaction: MessageReaction, user: User | PartialUser) {
        if(reaction.partial) {
            await reaction.fetch();
        }
    
        if(user.partial) {
            await user.fetch();
        }
    
        if(user.id === reaction.message.client.user.id) {
            return;
        }
    
        const guildSettings = dbHelpers.get(reaction.message.guild.id);
        if(!guildSettings) {
            return;
        }
    
        const filtered: any[] = guildSettings.react_messages.filter((r: react_messages) => {
            const emoji = (reaction.message.client.emojis.resolve(r.emoji) ?? r.emoji) as any;
            if(
                (emoji === r.emoji || emoji?.id === r.emoji) &&
                r.id === reaction.message.id
            ) {
                return r;
            }
        });
    
        if(filtered.length === 0) {
            return;
        }
    
        const member = await reaction.message.guild.members.fetch(user.id);
        if(member.manageable) {
            return member.roles.remove(filtered[0].role, 'Un-reacted'); // yeah, this is the only line that was edited from MessageReactionAdd
        }
    }
}