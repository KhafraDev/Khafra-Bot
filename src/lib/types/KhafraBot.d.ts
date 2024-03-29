import type { Snowflake } from 'discord.js'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HERE_WEATHER: string
      NASA: string
      OWLBOTIO: string | undefined
      POCKET_CONSUMER_KEY: string
      POCKET_SECRET_KEY: string
      POSTGRES_USER: string | undefined
      POSTGRES_PASS: string | undefined
      TMDB: string
      TOKEN: string
      WORKER_API_BASE: string | undefined
      WORKER_BIBLE_BASE: string | undefined
      [key: string]: never
    }
  }
}

type UUID4 = `${string}-${string}-${string}-${string}-${string}`

export interface kGuild {
  id: UUID4
  guild_id: Snowflake
  max_warning_points: number
  mod_log_channel: Snowflake | null
  welcome_channel: Snowflake | null
  ticketchannel: Snowflake | null
  staffChannel: Snowflake | null
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
  didEnd: boolean
}

export interface kReminder {
  id: UUID4
  userId: string
  message: string
  time: Date
  once: boolean
  interval: string
  didEnd: boolean
  paused: boolean
}
