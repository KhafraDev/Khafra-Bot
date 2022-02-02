import { client } from '#khaf/Client';
import { Arguments, Command } from '#khaf/Command';
import { logger } from '#khaf/Logger';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { once } from '#khaf/utility/Memoize.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { bold, inlineCode, italic, time } from '@khaf/builders';
import { Activity, Message, Snowflake, SnowflakeUtil, UserFlagsString } from 'discord.js';
import { join } from 'path';
import { ActivityType } from 'discord-api-types/v9';

const config = createFileWatcher({} as typeof import('../../../../config.json'), join(cwd, 'config.json'));

// found some of these images on a 3 year old reddit post
// https://www.reddit.com/r/discordapp/comments/8oa1jg/discord_badges/e025kpl

const formatPresence = (activities: Activity[] | undefined) => {
    if (!Array.isArray(activities)) return null;
    const push: string[] = [];

    for (const activity of activities) {
        switch (activity.type) {
            case ActivityType.Custom:
                push.push(`${activity.emoji ?? ''}${activity.state ? ` ${inlineCode(activity.state)}` : ''}`); break;
            case ActivityType.Listening:
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); break;
            case ActivityType.Game:
                push.push(`Playing ${italic(activity.name)}.`); break;
            default:
                logger.log(activity);
        }
    }

    return push.join('\n');
}

const emojis = new Map<UserFlagsString, string | undefined>();
// lazy load emojis
const getEmojis = once(() => {
    const flags = Object.entries(config.emoji.flags) as [UserFlagsString, Snowflake][];
    for (const [flag, emojiID] of flags)
        // not ruling out the possibility of the emoji not being cached
        emojis.set(flag, client.emojis.cache.get(emojiID)?.toString());

    return emojis;
});

// 84484653687267328 -> Certified moderator; early supporter; partnered server owner; early verified bot owner; brilliance
// 173547401905176585 -> Discord employee; bravery
// 104360151208706048 -> balance
// 140214425276776449 -> bug hunter 1
// 73193882359173120 -> hypesquad events; bug hunter 2

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get basic info about any user on Discord.',
                '@Khafra#0001', '165930518360227842'
            ],
			{
                name: 'user',
                folder: 'Server',
                args: [0, 1],
                aliases: [ 'userinfo' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message<true>, { content }: Arguments) {
        const user = await getMentions(message, 'users', content) ?? message.author;
        const member = user.equals(message.author) 
            ? message.member 
            : message.guild.members.resolve(user);

        const snowflake = SnowflakeUtil.timestampFrom(user.id);
        const flags = user.flags?.bitfield
            ? user.flags.toArray()
            : [];

        const emojis = flags
            .filter(f => getEmojis()?.has(f))
            .map(f => getEmojis()?.get(f));

        return this.Embed.ok(formatPresence(member?.presence?.activities) ?? undefined)
            .setAuthor({
                name: user.tag,
                iconURL: user.displayAvatarURL()
            })
            .addFields(
                { name: bold('Username:'), value: user.username, inline: true },
                { name: bold('ID:'), value: user.id, inline: true },
                { name: bold('Discriminator:'), value: `#${user.discriminator}`, inline: true },
                { name: bold('Bot:'), value: user.bot ? 'Yes' : 'No', inline: true },
                { name: bold('Badges:'), value: `${emojis.length > 0 ? emojis.join(' ') : 'None/Unknown'}`, inline: true },
                { name: bold('Account Created:'), value: time(Math.floor(snowflake / 1000)), inline: true }
            );
    }
}