import { Snowflake } from 'discord.js';

export interface kGuild {
    id: number
    guild_id: Snowflake
    prefix: string
    max_warning_points: number
    mod_log_channel: Snowflake | null
    complete_log_channel: Snowflake | null
    welcome_channel: Snowflake | null
    rules_channel: Snowflake | null
    reactRoleChannel: Snowflake | null
}

export interface Warning {
    id: number
    k_guild_id: Snowflake
    k_user_id: Snowflake
    k_points: number
    k_id: Snowflake
    k_ts: Date
}

export interface Giveaway {
    id: number
    guildid: Snowflake
    messageid: Snowflake
    channelid: Snowflake
    initiator: Snowflake
    enddate: Date
    prize: string
    winners: number
}