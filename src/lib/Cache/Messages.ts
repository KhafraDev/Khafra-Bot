import { LRU } from '../../Structures/LRU.js';
import type { Snowflake, Message } from 'discord.js';

export const MessagesLRU = new LRU<Snowflake, Message>();