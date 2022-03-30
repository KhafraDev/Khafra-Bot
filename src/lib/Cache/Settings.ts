import { LRU } from '#khaf/LRU';
import type { kGuild } from '#khaf/types/KhafraBot.js';
import type { Snowflake } from 'discord.js';

export const cache = new LRU<Snowflake, kGuild>({
    maxSize: 1_000,
    maxAgeMs: 60 * 1000 * 10
});