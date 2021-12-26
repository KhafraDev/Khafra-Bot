import { bold, inlineCode, italic, time } from '@khaf/builders';
import { Activity, Message, Snowflake, SnowflakeUtil, UserFlagsString } from 'discord.js';
import { join } from 'path';
import { client } from '../../../index.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { once } from '#khaf/utility/Memoize.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { Command } from '#khaf/Command';

const config = createFileWatcher({} as typeof import('../../../../config.json'), join(cwd, 'config.json'));

// found some of these images on a 3 year old reddit post
// https://www.reddit.com/r/discordapp/comments/8oa1jg/discord_badges/e025kpl

const formatPresence = (activities: Activity[] | undefined) => {
    if (!Array.isArray(activities)) return null;
    const push: string[] = [];

    for (const activity of activities) {
        switch (activity.type) {
            case 'CUSTOM':
                push.push(`${activity.emoji ?? ''}${activity.state ? ` ${inlineCode(activity.state)}` : ''}`); break;
            case 'LISTENING':
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); break;
            case 'PLAYING':
                push.push(`Playing ${italic(activity.name)}.`); break;
            default:
                console.log(activity);
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

    async init(message: Message<true>) {
        const user = await getMentions(message, 'users') ?? message.author;
        const member = user.equals(message.author) 
            ? message.member 
            : message.guild.members.resolve(user);

        const snowflake = SnowflakeUtil.deconstruct(user.id);
        const flags = user.flags?.bitfield
            ? user.flags.toArray()
            : [];

        const emojis = flags
            .filter(f => getEmojis().has(f))
            .map(f => getEmojis().get(f));

        return this.Embed.ok(formatPresence(member?.presence?.activities) ?? undefined)
            .setAuthor({
                name: user.tag,
                iconURL: user.displayAvatarURL() ?? message.client.user!.displayAvatarURL()
            })
            .addField(bold('Username:'), user.username, true)
            .addField(bold('ID:'), user.id, true)
            .addField(bold('Discriminator:'), `#${user.discriminator}`, true)
            .addField(bold('Bot:'), user.bot !== undefined ? user.bot === true ? 'Yes' : 'No' : 'Unknown', true)
            .addField(bold('Badges:'), `${emojis.length > 0 ? emojis.join(' ') : 'None/Unknown'}`, true)
            .addField(bold('Account Created:'), time(snowflake.date), true);
    }
}