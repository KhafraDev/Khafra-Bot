import { 
    Channel, 
    TextChannel, 
    NewsChannel, 
    DMChannel 
} from 'discord.js';

export const isText = <T extends Channel>(c: T): c is T & (TextChannel | NewsChannel) => c.type === 'text' || c.type === 'news';
export const isDM = <T extends Channel>(c: T): c is T & DMChannel => c.type === 'dm';