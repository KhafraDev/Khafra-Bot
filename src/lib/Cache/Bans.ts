import { GuildMember } from 'discord.js';

interface Ban {
    staff: GuildMember
    time: number
}

/**
 * Cache for bans that occur in a guild.
 * 
 * Messages are sent to the log channels from the guildBanAdd event.
 * @link { https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildBanAdd }
 */
export const bans = new Map<string, Ban>();