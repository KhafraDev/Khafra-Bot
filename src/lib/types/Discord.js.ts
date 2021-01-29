import { 
    Channel, 
    TextChannel, 
    NewsChannel, 
    DMChannel, 
    VoiceChannel
} from 'discord.js';

export const isText = <T extends Channel>(c: T): c is T & (TextChannel | NewsChannel) => 
    typeof c !== null &&
    (c.type === 'text' || c.type === 'news');
export const isDM = <T extends Channel>(c: T): c is T & DMChannel => c.type === 'dm';
export const isExplicitText = <T extends Channel>(c: T): c is T & TextChannel => c.type === 'text';
export const isVoice = <T extends Channel>(c: T): c is T & VoiceChannel => c.type === 'voice';