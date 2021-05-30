import { Snowflake } from 'discord.js';

export interface kGuild {
    id: number
    guild_id: string
    prefix: string
    max_warning_points: number
    mod_log_channel: string | null
    welcome_channel: string | null
    rules_channel: string | null
}

/**
 * Warning row when the kbGuild and kbWarns are joined.
 */
export interface WarningJoined {
    id: number
    guild_id: Snowflake
    max_warning_points: number
    k_guild_id: Snowflake
    k_user_id: Snowflake
    k_points: number
    k_ts: Date
}

export interface Warning {
    id: number
    k_guild_id: string
    k_user_id: string
    k_points: number
    k_ts: Date
}