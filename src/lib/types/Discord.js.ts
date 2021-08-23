import { 
    TextChannel, 
    NewsChannel, 
    DMChannel, 
    VoiceChannel,
    CategoryChannel,
    StageChannel,
    ThreadChannel,
    PartialDMChannel
} from 'discord.js';

export const isText = <T extends unknown>(c: T): c is T & (TextChannel | NewsChannel) => 
    c instanceof TextChannel || c instanceof NewsChannel;
export const isDM = <T extends unknown>(c: T): c is T & DMChannel | T & PartialDMChannel => c instanceof DMChannel
export const isExplicitText = <T extends unknown>(c: T): c is T & TextChannel => c instanceof TextChannel;
export const isVoice = <T extends unknown>(c: T): c is T & VoiceChannel => c instanceof VoiceChannel;
export const isCategory = <T extends unknown>(c: T): c is T & CategoryChannel => c instanceof CategoryChannel;
export const isStage = <T extends unknown>(c: T): c is T & StageChannel => c instanceof StageChannel;
export const isThread = <T extends unknown>(c: T): c is T & ThreadChannel => c instanceof ThreadChannel;

export type Message = import('discord.js').Message
    & { guild: import('discord.js').Guild }
    & { member: import('discord.js').GuildMember }
;