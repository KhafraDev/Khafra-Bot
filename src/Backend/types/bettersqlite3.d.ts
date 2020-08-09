import { Snowflake } from "discord.js";

export type reacts = {
    id: string;
    emoji:  string;
    chance: string;      
};

export type react_messages = {
    id: string;
    emoji: string;
    role: string;
};

export type list = {
    name: string,
    type: 'blacklist' | 'whitelist',
    users: Snowflake[],            // block these people from using it
    channels: Snowflake[],       // channels where command isn't allowed
    guild: boolean,
}

export interface dbGuild {
    id: string;
    owner_id: string; 
    custom_commands: list[], // not yet implemented 
    reacts: reacts[];
    react_messages: react_messages[];
    prefix: string;
}