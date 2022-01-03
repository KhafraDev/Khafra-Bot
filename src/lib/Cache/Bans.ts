import { GuildMember } from 'discord.js';
import { LRU } from '#khaf/LRU';

// TODO: remove this!

interface Ban {
    member: GuildMember
    reason: string
}

/**
 * Cache for bans that occur from the bot banning a user.
 * 
 * Messages are sent to the log channels from the guildBanAdd event.
 * @link { https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildBanAdd }
 */
export const bans = new LRU<string, Ban>();