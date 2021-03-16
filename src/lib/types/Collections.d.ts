import { ObjectId } from 'mongodb';
import { Snowflake } from 'discord.js';

export interface QuranExcerpt {
    _id: ObjectId
    title: string
    verses: {
        book: number
        verse: number
        content: string
    }[]
}

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

export interface Warnings {
    _id: ObjectId
    id: string,
    limit: number
    users: {
        [key: string]: {
            active: number,
            inactive: number,
            warns: {
                reason: string,
                points: number
            }[]
        }
    }
}

export interface PocketUser {
    _id: ObjectId
    id: string
    access_token: string
    request_token: string
    username: string
}

export interface GuildSettings {
    _id: ObjectId
    id: string
    prefix: string
    /**
     * Names of commands whitelisted on the server.
     */
    whitelist: string[]
    /**
     * Names of commands blacklisted on the server.
     */
    blacklist: string[]
    welcomeChannel: string
    modActionLogChannel: string
    rules: {
        channel: string
        rules: { index: number, rule: string }[] 
    }
}

export interface Tags {
    _id: ObjectId
    id: string
    name: string
    owner: string
    content: string
    created: number,
    history?: {
        old: string
        new: string
        now: number
    }[]
}