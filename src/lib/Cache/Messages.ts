import { LRU } from '#khaf/LRU'
import type { Snowflake, Message } from 'discord.js'

export const MessagesLRU = new LRU<Snowflake, Message>()