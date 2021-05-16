import { ObjectId } from 'mongodb';
import { Snowflake } from 'discord.js';

export interface Insights {
    _id: ObjectId
    id: string
    daily: {
        [key: string]: {
            left: number
            total: number
            joined: number
        }
    }
}