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
    limit?: number
    users:{
        [key: string]: {
            points: number
            reasons:{
                points: number
                message: string
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

export interface RollingStones {
    _id: ObjectId
    image: string
    place: number
    title: string
    permalink: string
    bio: string
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
    }[]
    enabled?: {
        command: string
        aliases?: string[]
        type: 'role' | 'guild' | 'user' | 'channel'
        id?: string
    }[],
    disabled?: {
        command: string
        aliases?: string[]
        type: 'role' | 'guild' | 'user' | 'channel'
        id?: string
    }[]
}

export interface Tags {
    _id: ObjectId
    id: string
    tags: {
        [key: string]: {
            name: string
            owner: string
            value: string
            created: Date
        }
    }
}

export interface Onion {
    href: string,
    title: string
}