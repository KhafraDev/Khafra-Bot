import { Snowflake } from 'discord.js';

export interface Ipsum_Account {
    playerid: string,
    userid: Snowflake | null,
    firstplayed: Date,
    lastactive: Date
}