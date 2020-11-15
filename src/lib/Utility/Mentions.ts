import { Message, SnowflakeUtil } from "discord.js";

const REGEX: Record<string, [RegExp, number]> = {
    users: [/(<@!)?(\d{17,19})>?/, 2],
    members: [/(<@!)?(\d{17,19})>?/, 2],
    channels: [/<?#?(\d{17,19})>?/, 1],
    roles: [/<?@?&?(\d{17,19})>?/, 1]
}
const epoch = new Date('January 1, 2015 GMT-0');
const zeroBinary = ''.padEnd(64, '0');

type MentionsOpts = {
    index?: number,
    type?: 'roles' | 'users' | 'members' | 'channels'
}

export const getMentions = (
    { mentions }: Message,
    args: string[],
    { index = 0, type = 'users' }: MentionsOpts = {}
) => {
    const um = mentions[type];
    if(Array.isArray(args) && args.length > 0) {
        const reg = REGEX[type];
        if(reg[0].test(args[index])) {
            const id = args[index].match(reg[0])[reg[1]];
            // absolutely horrible
            // https://github.com/microsoft/TypeScript/issues/33591
            return (um.find as (u: any) => any)((u: { id: string; }) => u.id === id) ?? id;
        }
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