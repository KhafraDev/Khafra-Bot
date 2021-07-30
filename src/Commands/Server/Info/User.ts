import { Command } from '../../../Structures/Command.js';
import { SnowflakeUtil, Snowflake, Activity } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { UserFlagsString } from 'discord.js';
import { client } from '../../../index.js';
import { once } from '../../../lib/Utility/Memoize.js';
import { time } from '@discordjs/builders';
import { Message } from '../../../lib/types/Discord.js.js';

import { createFileWatcher } from '../../../lib/Utility/FileWatcher.js';
import { cwd } from '../../../lib/Utility/Constants/Path.js';
import { join } from 'path';

const config = {} as typeof import('../../../../config.json');
createFileWatcher(config, join(cwd, 'config.json'));

// found some of these images on a 3 year old reddit post
// https://www.reddit.com/r/discordapp/comments/8oa1jg/discord_badges/e025kpl

const formatPresence = (activities: Activity[] | undefined) => {
    if (!Array.isArray(activities)) return null;
    const push: string[] = [];

    for (const activity of activities) {
        switch (activity.type) {
            case 'CUSTOM':
                push.push(`${activity.emoji ?? ''}${activity.state ? ` \`\`${activity.state}\`\`` : ''}`); break;
            case 'LISTENING':
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); break;
            case 'PLAYING':
                push.push(`Playing *${activity.name}*.`); break;
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

@RegisterCommand
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
                aliases: [ 'userinfo' ]
            }
        );
    }

    async init(message: Message) {
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

        return this.Embed.success(formatPresence(member?.presence?.activities) ?? undefined)
            .setAuthor(user.tag, user.displayAvatarURL() ?? message.client.user!.displayAvatarURL())
            .addField('**Username:**', user.username, true)
            .addField('**ID:**', user.id, true)
            .addField('**Discriminator:**', `#${user.discriminator}`, true)
            .addField('**Bot:**', user.bot !== undefined ? user.bot === true ? 'Yes' : 'No' : 'Unknown', true)
            .addField('**Badges:**', `${emojis.length > 0 ? emojis.join(' ') : 'None/Unknown'}`, true)
            .addField('**Account Created:**', time(snowflake.date), true);
    }
}