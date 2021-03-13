import { 
    Channel, 
    TextChannel, 
    NewsChannel, 
    DMChannel, 
    VoiceChannel
} from 'discord.js';

export const isText = <T extends Channel>(c: T): c is T & (TextChannel | NewsChannel) => 
    c instanceof TextChannel || c instanceof NewsChannel;
export const isDM = <T extends Channel>(c: T): c is T & DMChannel => c instanceof DMChannel
export const isExplicitText = <T extends Channel>(c: T): c is T & TextChannel => c instanceof TextChannel;
export const isVoice = <T extends Channel>(c: T): c is T & VoiceChannel => c instanceof VoiceChannel;