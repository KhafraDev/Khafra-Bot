import { Message, SnowflakeUtil, Role, User, GuildMember, Snowflake, GuildBasedChannel, TextBasedChannel } from 'discord.js';
import { dontThrow } from './Don\'tThrow.js';

type MentionTypes = User | GuildBasedChannel | TextBasedChannel | GuildMember | Role;

type MessageMentionTypes = 
    | 'roles' 
    | 'users' 
    | 'members' 
    | 'channels';

const epoch = new Date('January 1, 2015 GMT-0');
const zeroBinary = '0'.repeat(64);

/** matches all Discord mention types */
const mentionMatcher = /<?(@!?|@&|#)?(\d{17,19})>?/g;

export async function getMentions(message: Message<true>, type: 'roles'): Promise<Role | null>;
export async function getMentions(message: Message, type: 'users'): Promise<User | null>;
export async function getMentions(message: Message<true>, type: 'members'): Promise<GuildMember | null>;
export async function getMentions(message: Message<true>, type: 'channels'): Promise<GuildBasedChannel | null>;
export async function getMentions(
    message: Message, 
    fetchType: MessageMentionTypes
) {
    const { mentions, content, guild, client} = message;
    if (fetchType !== 'users' && !message.inGuild()) return null;

    for (const [, type, id] of content.matchAll(mentionMatcher)) {
        let pr: Promise<MentionTypes | null> | MentionTypes | null | undefined; 

        if (type) {
            // not a channel mention
            if (type === '#' && fetchType !== 'channels') continue;
            // not a member or user mention
            if ((type === '@!' || type === '@') && fetchType !== 'members' && fetchType !== 'users') continue;
            // not a role mention
            if (type === '@&' && fetchType !== 'roles') continue;
        }

        if (fetchType === 'channels') {
            pr = mentions.channels.get(id) ?? guild!.channels.cache.get(id);
        } else if (fetchType === 'members') {
            pr = mentions.members?.get(id) ?? guild!.members.cache.get(id);
        } else if (fetchType === 'roles') {
            pr = mentions.roles.get(id) ?? guild!.roles.cache.get(id);
        } else {
            pr = client.users.cache.get(id);
        }

        pr ??= fetchType === 'users'
            ? client.users.fetch(id)
            : guild![fetchType].fetch(id);

        const result = pr instanceof Promise
            ? await dontThrow(pr)
            : [null, pr]

        return result[1] ?? null;
    }

    return null;
}

export const validSnowflake = (id: unknown): id is Snowflake => {
    if (typeof id !== 'string')
        return false;
    else if (!/^\d{17,19}$/.test(id))
        return false;
        
    const snowflake = SnowflakeUtil.deconstruct(id);
    if ( 
        snowflake.date.getTime() === epoch.getTime()
        || snowflake.binary === zeroBinary
        || snowflake.timestamp >= Date.now()
        || snowflake.timestamp === epoch.getTime() // just in case
    ) {
        return false;
    }

    return true;
}