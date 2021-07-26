import { Arguments, Command } from '../../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { isText, isVoice, isExplicitText, Message } from '../../../lib/types/Discord.js.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { bold, time } from '@discordjs/builders';
import { padEmbedFields } from '../../../lib/Utility/Constants/Embeds.js';

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

    async init(message: Message, { content }: Arguments) {
        const channel = 
            await getMentions(message, 'channels') ?? 
            message.guild.channels.cache.find(c => c.name.toLowerCase() === content.toLowerCase()) ??
            message.channel;

        if (!hasPerms(channel, message.member, Permissions.FLAGS.VIEW_CHANNEL)) {
            return this.Embed.fail('No channel with that name was found!'); 
        }

        const embed = this.Embed.success()
            .addFields(
                { name: '**ID:**', value: channel.id, inline: true },
                { name: '**Type:**', value: channel.type, inline: true },
                { name: bold('Created:'), value: time(channel.createdAt, 'f'), inline: true }
            );

        if (isText(channel)) {
            embed
                .setDescription(`
                ${channel}
                ${channel.topic ? `\`\`\`${channel.topic}\`\`\`` : ''}
                `)
                .addFields(
                    { name: '**Name:**', value: channel.name, inline: true },
                    { name: '**Parent:**', value: channel.parent ? `${channel.parent}` : 'None', inline: true },
                    { name: '**NSFW:**', value: channel.nsfw ? 'Yes' : 'No', inline: true },
                    { name: '**Position:**', value: `${channel.position}`, inline: true },
                );

            if (isExplicitText(channel)) {
                embed.addField('**Rate-Limit:**', channel.rateLimitPerUser + ' seconds', true);
            }
        } else if (isVoice(channel)) {
            embed
                .addField('**Bitrate:**',   channel.bitrate.toLocaleString(), true)
                .addField('**Full:**',      channel.full ? 'Yes' : 'No', true)
                .addField('**Max Users:**', channel.userLimit === 0 ? 'Unlimited' : `${channel.userLimit}`, true)
        }

        return padEmbedFields(embed);
    }
}