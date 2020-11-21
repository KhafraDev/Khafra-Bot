import { ObjectId } from 'mongodb';

export interface BibleExcerpt {
    _id: ObjectId
    book: string
    chapter: number
    verse: number
    content: string
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
            points: number
            reason: string
            timestamp: number
        }[]
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
    prefix?: string
    roleReacts?: {
        message: string
        role: string
        channel: string
        emoji: string
    }[]
    commandRole?: {
        role: string
        command: string
        message?: string
    }[]
    disabledChannel?: {
        main: string
        names: string[]
        id: string
    }[]
    disabledRole?: {
        main: string
        names: string[]
        id: string
    }[]
    disabledUser?: {
        main: string
        names: string[]
        id: string
    }[]
    disabledGuild?: {
        main: string
        names: string[]
    }[]
    welcomeChannel?: string
    modActionLogChannel?: string
    rules?: {
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