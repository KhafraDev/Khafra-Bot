import { LRU } from '#khaf/LRU';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { Snowflake } from 'discord.js';

export const cache = new LRU<Snowflake, kGuild>({
    maxSize: 1_000,
    maxAgeMs: 60 * 1000 * 10
});