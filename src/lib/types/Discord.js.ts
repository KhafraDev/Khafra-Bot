import { 
    Channel, 
    TextChannel, 
    NewsChannel, 
    DMChannel, 
    VoiceChannel,
    CategoryChannel,
    StageChannel,
    ThreadChannel
} from 'discord.js';
import type EventEmitter from 'events';

export const isText = <T extends Channel>(c: T): c is T & (TextChannel | NewsChannel) => 
    c instanceof TextChannel || c instanceof NewsChannel;
export const isDM = <T extends Channel>(c: T): c is T & DMChannel => c instanceof DMChannel
export const isExplicitText = <T extends Channel>(c: T): c is T & TextChannel => c instanceof TextChannel;
export const isVoice = <T extends Channel>(c: T): c is T & VoiceChannel => c instanceof VoiceChannel;
export const isCategory = <T extends Channel>(c: T): c is T & CategoryChannel => c instanceof CategoryChannel;
export const isStage = <T extends Channel>(c: T): c is T & StageChannel => c instanceof StageChannel;
export const isThread = <T extends Channel>(c: T): c is T & ThreadChannel => c instanceof ThreadChannel;

declare module 'discord.js' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Collector<K, V, F extends unknown[] = []> extends EventEmitter {
        on<T extends unknown>(event: 'collect' | 'dispose', listener: (...args: T[]) => Awaited<void>): this;
        once<T extends unknown>(event: 'collect' | 'dispose', listener: (...args: T[]) => Awaited<void>): this;
    }
}