import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { formatDate } from '../../../lib/Utility/Date.js';
import { isText, isVoice, isExplicitText } from '../../../lib/types/Discord.js.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get info on a specified channel!',
                '#general',
                '705896160673661041'
            ],
			{
                name: 'channel',
                folder: 'Server',
                aliases: [ 'chan', 'channelinfo' ],
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        const channel = await getMentions(message, 'channels') ?? message.channel;

        const embed = this.Embed.success()
            .addFields(
                { name: '**ID:**', value: channel.id, inline: true },
                { name: '**Type:**', value: channel.type, inline: true }
            )
            .setFooter(`Created ${formatDate('MMM. Do, YYYY hh:mm:ssA t', channel.createdTimestamp)}`);

        if (isText(channel)) {
            embed
                .setDescription(`
                ${channel}
                ${channel.topic ? `\`\`\`${channel.topic}\`\`\`` : ''}
                `)
                .addFields(
                    { name: '**Name:**', value: channel.name, inline: true },
                    { name: '**Parent:**', value: channel.parent ?? 'None', inline: true },
                    { name: '**NSFW:**', value: channel.nsfw ? 'Yes' : 'No', inline: true },
                    { name: '**Position:**', value: channel.position, inline: true },
                );

            if (isExplicitText(channel)) {
                embed.addField('**Rate-Limit:**', channel.rateLimitPerUser + ' seconds', true);
            }
        } else if (isVoice(channel)) {
            embed
                .addField('**Bitrate:**',   channel.bitrate.toLocaleString(), true)
                .addField('**Full:**',      channel.full ? 'Yes' : 'No', true)
                .addField('**Max Users:**', channel.userLimit === 0 ? 'Unlimited' : channel.userLimit, true)
        }

        return embed;
    }
}