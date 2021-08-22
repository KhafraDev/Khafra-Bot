import type { Snowflake } from 'discord.js';

type UUID4 = `${string}-${string}-${string}-${string}-${string}`;

export interface kGuild {
    id: UUID4
    guild_id: Snowflake
    prefix: string
    max_warning_points: number
    mod_log_channel: Snowflake | null
    welcome_channel: Snowflake | null
    reactRoleChannel: Snowflake | null
    ticketChannel: Snowflake | null
}

export interface Warning {
    id: UUID4
    k_guild_id: Snowflake
    k_user_id: Snowflake
    k_points: number
    k_ts: Date
}

export interface Giveaway {
    id: UUID4
    guildid: Snowflake
    messageid: Snowflake
    channelid: Snowflake
    initiator: Snowflake
    enddate: Date
    prize: string
    winners: number
}

export type PartialGuild = Pick<kGuild, 'prefix' | 'max_warning_points' | 'mod_log_channel' | 'welcome_channel'>;