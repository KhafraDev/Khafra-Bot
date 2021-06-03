import { Command } from '../../../Structures/Command.js';
import { Message, Activity, SnowflakeUtil } from 'discord.js';
import { formatDate } from '../../../lib/Utility/Date.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { UserFlagsString } from 'discord.js';
import { client } from '../../../index.js';
import config from '../../../../config.json';

const formatPresence = (activities: Activity[]) => {
    const push: string[] = [];
    for (const activity of activities) {
        switch(activity.type) {
            case 'CUSTOM_STATUS':
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

const emojis = new Map<UserFlagsString, string>();
// lazy load emojis
const getEmojis = () => {
    if (emojis.size > 0) return emojis;

    for (const [flag, emojiID] of Object.entries(config.emoji.flags) as [UserFlagsString, `${bigint}`][])
        // not ruling out the possibility of the emoji not being cached
        emojis.set(flag, client.emojis.cache.get(emojiID)?.toString());

    return emojis;
}

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

        const snowflake = SnowflakeUtil.deconstruct(user.id);
        const flags = user.flags?.bitfield !== 0
            ? user.flags!.toArray()
            : [];

        const emojis = flags
            .filter(f => getEmojis().has(f))
            .map(f => getEmojis().get(f));

        return this.Embed.success(formatPresence(user.presence.activities))
            .setAuthor(user.tag, user.displayAvatarURL() ?? message.client.user.displayAvatarURL())
            .addField('**Username:**', user.username, true)
            .addField('**ID:**', user.id, true)
            .addField('**Discriminator:**', `#${user.discriminator}`, true)
            .addField('**Bot:**', user.bot !== undefined ? user.bot === true ? 'Yes' : 'No' : 'Unknown', true)
            .addField('**Badges:**', `${emojis.length > 0 ? emojis.join(' ') : 'None/Unknown'}`, true)
            .addField('**Account Created:**', formatDate('MMM. Do, YYYY hh:mm:ssA t', snowflake.date), true);
    }
}