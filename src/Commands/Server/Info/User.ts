import { Command } from '../../../Structures/Command.js';
import { Message, Activity, SnowflakeUtil } from 'discord.js';
import { formatDate } from '../../../lib/Utility/Date.js';
import { _getMentions } from '../../../lib/Utility/Mentions.js';

const formatPresence = (activities: Activity[]) => {
    const push: string[] = [];
    for(const activity of activities) {
        switch(activity.type) {
            case 'CUSTOM_STATUS':
                push.push(`${activity.emoji ?? ' '}\`\`${activity.state}\`\``); break;
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

export default class extends Command {
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
        const user = await _getMentions(message, 'users') ?? message.author;

        const snowflake = SnowflakeUtil.deconstruct(user.id);
        const embed = this.Embed.success(formatPresence(user.presence.activities))
            .setAuthor(user.tag, user.displayAvatarURL() ?? message.client.user.displayAvatarURL())
            .addField('**Username:**', user.username, true)
            .addField('**ID:**', user.id, true)
            .addField('**Discriminator:**', user.discriminator, true)
            .addField('**Bot:**', user.bot !== undefined ? user.bot === true ? 'Yes' : 'No' : 'Unknown', true)
            .addField('**Flags:**', !user.flags || user.flags.bitfield === 0 ? 'Unknown' : user.flags?.toArray().join(', '), true)
            .addField('**Created:**', formatDate('MMM. Do, YYYY hh:mm:ssA t', snowflake.date), true);

        return message.reply(embed);
    }
}