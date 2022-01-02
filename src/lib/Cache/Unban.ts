import { GuildMember } from 'discord.js';
import { LRU } from '#khaf/LRU';

interface Unban {
    member: GuildMember
    reason: string
}

/**
 * Cache for unbans that occur from the bot unbanning a user.
 * 
 * Messages are sent to the log channels from the guildBanAdd event.
 * @link { https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildBanAdd }
 */
export const unbans = new LRU<string, Unban>();