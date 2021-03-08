import { Message, SnowflakeUtil, Role, User, GuildMember, GuildChannel } from 'discord.js';
import { client } from '../../index.js';

type MessageMentionTypes = 
    | 'roles' 
    | 'users' 
    | 'members' 
    | 'channels';

const REGEX = {
    users: /(<@!)?(\d{17,19})>?/,
    members: /(<@!)?(\d{17,19})>?/,
    channels: /<?#?(\d{17,19})>?/, 
    roles: /<?@?&?(\d{17,19})>?/,
}
const epoch = new Date('January 1, 2015 GMT-0');
const zeroBinary = '0'.repeat(64);

export async function getMentions(message: Message, type: 'roles'): Promise<Role>;
export async function getMentions(message: Message, type: 'users'): Promise<User>;
export async function getMentions(message: Message, type: 'members'): Promise<GuildMember>;
export async function getMentions(message: Message, type: 'channels'): Promise<GuildChannel>;
export async function getMentions(
    { mentions, content, guild }: Message, 
    type: MessageMentionTypes
) {
    const args = content.split(/\s+/g);
    if (REGEX.users.test(args[0])) // if the client user is the first mentioned
        args.splice(0, 2); // remove the first two elements in args
    else 
        args.splice(0, 1); // normal prefixed command

    if (REGEX[type].test(args[0])) {
        const id = args[0].replace(/[^0-9]/g, ''); // replace non-numeric characters
        // sometimes, especially for users, they might not be cached/auto fetched
        // for the bot, so no items will be in the collection
        const item = [...mentions[type]].find(i => i[1].id === id)?.pop() ?? id;

        // if it's not a string, no need to fetch it; we can just return it!
        if (typeof item !== 'string')
            return item;

        if (type === 'members' || type === 'roles') {
            try {
                const coll = await guild[type].fetch(item);
                return coll;
            } catch {}
        } else if (type === 'channels') {
            return guild.channels.cache.find(c => c.id === item);
        } else {
            try {
                const users = await client.users.fetch(item);
                return users;
            } catch {}
        }

        return null;
    }
}

export const validSnowflake = (id: string) => {
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