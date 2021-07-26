import { Message, SnowflakeUtil, Role, User, GuildMember, GuildChannel, Snowflake } from 'discord.js';
import { client } from '../../index.js';

interface Options {
    splice?: boolean
    idx?: number
}

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
const opts: Options = {
    splice: true,
    idx: 0
}

export async function getMentions(message: Message, type: 'roles', options?: Options): Promise<Role>;
export async function getMentions(message: Message, type: 'users', options?: Options): Promise<User>;
export async function getMentions(message: Message, type: 'members', options?: Options): Promise<GuildMember>;
export async function getMentions(message: Message, type: 'channels', options?: Options): Promise<GuildChannel>;
export async function getMentions(
    { mentions, content, guild }: Message, 
    type: MessageMentionTypes,
    options: Options = opts
) {
    const args = content.split(/\s+/g);
    if (options.splice)
        args.splice(0, 1); // normal prefixed command

    if (REGEX[type].test(args[options.idx!])) {
        const id = args[options.idx!].replace(/[^0-9]/g, ''); // replace non-numeric characters
        if (!validSnowflake(id)) return null;
        // sometimes, especially for users, they might not be cached/auto fetched
        // for the bot, so no items will be in the collection
        const item = mentions[type]?.get(id) ?? id;

        // if it's not a string, no need to fetch it; we can just return it!
        if (typeof item !== 'string')
            return item;
        if (guild === null)
            return null;

        if (type === 'members' || type === 'roles') {
            try {
                const coll = await guild[type].fetch(item); // cache is checked with this
                return coll;
            } catch {}
        } else if (type === 'channels') {
            // only TextChannels/NewsChannels can be mentioned. Voice channels and stage channels 
            // can only be fetched given its id!
            return guild.channels.cache.get(item);
        } else {
            try {
                const users = await client.users.fetch(item);
                return users;
            } catch {}
        }

        return null;
    }
}

export const validSnowflake = (id: unknown): id is Snowflake => {
    if (typeof id !== 'string')
        return false;
    else if (!/^\d{17,19}$/.test(id))
        return false;
        
    const snowflake = SnowflakeUtil.deconstruct(id as Snowflake);
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