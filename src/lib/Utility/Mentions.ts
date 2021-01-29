import { Message, SnowflakeUtil, Role, User, GuildMember, GuildChannel } from 'discord.js';
import { client } from '../../index.js';

type MessageMentionTypes = 
    | 'roles' 
    | 'users' 
    | 'members' 
    | 'channels';

interface MentionReturns {
    roles: Role
    users: User
    members: GuildMember
    channels: GuildChannel 
}

const REGEX: Record<MessageMentionTypes, [RegExp, number]> = {
    users: [/(<@!)?(\d{17,19})>?/, 2],
    members: [/(<@!)?(\d{17,19})>?/, 2],
    channels: [/<?#?(\d{17,19})>?/, 1],
    roles: [/<?@?&?(\d{17,19})>?/, 1]
}
const epoch = new Date('January 1, 2015 GMT-0');
const zeroBinary = '0'.repeat(64);

export const getMentions = async <T extends MessageMentionTypes>(
    { mentions, content, guild }: Message,
	type: T
): Promise<MentionReturns[T]> => {
    const args = content.split(/\s+/g);
    if (REGEX.users[0].test(args[0])) // if the client user is the first mentioned
        args.splice(0, 2); // remove the first two elements in args
    else 
        args.splice(0, 1); // normal prefixed command

    if (REGEX[type][0].test(args[0])) {
        const id = args[0].replace(/[^0-9]/g, ''); // replace non-numeric characters
        // sometimes, especially for users, they might not be cached/auto fetched
        // for the bot, so no items will be in the collection
        const item = [...mentions[type]].find(i => i[1].id === id)?.pop() ?? id;

        // if it's not a string, no need to fetch it; we can just return it!
        if (typeof item !== 'string')
            return item as MentionReturns[T];

        if (type === 'members' || type === 'roles') {
            try {
                const coll = await guild[type as 'members' | 'roles'].fetch(item);
                return coll as MentionReturns[T];
            } catch {}
        } else if (type === 'channels') {
            return guild.channels.cache.find(c => c.id === item) as MentionReturns[T];
        } else {
            try {
                const users = await client.users.fetch(item);
                return users as MentionReturns[T];
            } catch {}
        }

        return null;
    }
}

export const validSnowflake = (id: string) => {
    const snowflake = SnowflakeUtil.deconstruct(id);
    if( 
        snowflake.date.getTime() === epoch.getTime()
        || snowflake.binary === zeroBinary
        || snowflake.timestamp >= Date.now()
        || snowflake.timestamp === epoch.getTime() // just in case
    ) {
        return false;
    }

    return true;
}