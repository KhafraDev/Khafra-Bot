import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import {
    SnowflakeUtil,
    type Channel,
    type GuildBasedChannel,
    type GuildMember,
    type Message,
    type Role,
    type Snowflake,
    type User
} from 'discord.js'
import * as util from '#khaf/utility/Discord/util.js'

type MentionTypes = User | Channel | GuildMember | Role

type MessageMentionTypes =
    | 'roles'
    | 'users'
    | 'members'
    | 'channels'

const epoch = new Date('January 1, 2015 GMT-0').getTime()

/** matches all Discord mention types */
const mentionMatcher = /<?(@!?|@&|#)?(\d{17,19})>?/g

export async function getMentions(message: Message<true>, type: 'roles'): Promise<Role | null>
export async function getMentions(message: Message, type: 'users', content?: string): Promise<User | null>
export async function getMentions(message: Message<true>, type: 'members', content?: string): Promise<GuildMember | null>
export async function getMentions(message: Message<true>, type: 'channels'): Promise<GuildBasedChannel | null>
export async function getMentions(
    message: Message,
    fetchType: MessageMentionTypes,
    text?: string
): Promise<Role | User | GuildMember | GuildBasedChannel | MentionTypes | null> {
    if (fetchType !== 'users' && !message.inGuild()) return null

    const { mentions, content: messageContent, guild, client} = message as Message<true>
    const content = typeof text === 'string' ? text : messageContent

    for (const [, type, id] of content.matchAll(mentionMatcher)) {
        let pr: Promise<MentionTypes | null> | MentionTypes | null = null

        if (type) {
            // not a channel mention
            if (type === '#' && fetchType !== 'channels') continue
            // not a member or user mention
            if ((type === '@!' || type === '@') && fetchType !== 'members' && fetchType !== 'users') continue
            // not a role mention
            if (type === '@&' && fetchType !== 'roles') continue
        }

        if (fetchType === 'channels') {
            pr = mentions.channels.get(id) ?? guild.channels.cache.get(id) ?? null
        } else if (fetchType === 'members') {
            pr = mentions.members?.get(id) ?? guild.members.cache.get(id) ?? null
        } else if (fetchType === 'roles') {
            pr = mentions.roles.get(id) ?? guild.roles.cache.get(id) ?? null
        } else {
            pr = client.users.cache.get(id) ?? null
        }

        pr ??= fetchType === 'users'
            ? client.users.fetch(id)
            : guild[fetchType].fetch(id)

        const result = pr instanceof Promise
            ? await dontThrow(pr)
            : [null, pr]

        return result[1] ?? null
    }

    return null
}

export const validSnowflake = (id: unknown): id is Snowflake => {
    if (typeof id !== 'string' || !util.isSnowflake(id)) {
        return false
    }

    const timestamp = SnowflakeUtil.timestampFrom(id)

    return timestamp > epoch && timestamp <= Date.now()
}