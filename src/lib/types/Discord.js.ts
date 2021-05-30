import { 
    Channel, 
    TextChannel, 
    NewsChannel, 
    DMChannel, 
    VoiceChannel,
    CategoryChannel,
    StageChannel
} from 'discord.js';

export const isText = <T extends Channel>(c: T): c is T & (TextChannel | NewsChannel) => 
    c instanceof TextChannel || c instanceof NewsChannel;
export const isDM = <T extends Channel>(c: T): c is T & DMChannel => c instanceof DMChannel
export const isExplicitText = <T extends Channel>(c: T): c is T & TextChannel => c instanceof TextChannel;
export const isVoice = <T extends Channel>(c: T): c is T & VoiceChannel => c instanceof VoiceChannel;
export const isCategory = <T extends Channel>(c: T): c is T & CategoryChannel => c instanceof CategoryChannel;
export const isStage = <T extends Channel>(c: T): c is T & StageChannel => c instanceof StageChannel;