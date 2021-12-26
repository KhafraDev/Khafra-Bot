import { bold, codeBlock, time } from '@khaf/builders';
import { Message, Permissions } from 'discord.js';
import { isExplicitText, isText, isVoice } from '../../../lib/types/Discord.js.js';
import { padEmbedFields } from '#khaf/utility/Constants/Embeds.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Arguments, Command } from '#khaf/Command';

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

    async init(message: Message<true>, { content }: Arguments) {
        const channel = 
            await getMentions(message, 'channels') ?? 
            message.guild.channels.cache.find(c => c.name.toLowerCase() === content.toLowerCase()) ??
            message.channel;

        if (!hasPerms(channel, message.member, Permissions.FLAGS.VIEW_CHANNEL)) {
            return this.Embed.error('No channel with that name was found!'); 
        }

        const embed = this.Embed.ok()
            .addFields(
                { name: bold('ID:'), value: channel.id, inline: true },
                { name: bold('Type:'), value: channel.type, inline: true },
                { name: bold('Created:'), value: time(channel.createdAt, 'f'), inline: true }
            );

        if (isText(channel)) {
            embed
                .setDescription(`
                ${channel}
                ${channel.topic ? codeBlock(`${channel.topic}`) : ''}
                `)
                .addFields(
                    { name: bold('Name:'), value: channel.name, inline: true },
                    { name: bold('Parent:'), value: channel.parent ? `${channel.parent}` : 'None', inline: true },
                    { name: bold('NSFW:'), value: channel.nsfw ? 'Yes' : 'No', inline: true },
                    { name: bold('Position:'), value: `${channel.position}`, inline: true },
                );

            if (isExplicitText(channel)) {
                embed.addField(bold('Rate-Limit:'), channel.rateLimitPerUser + ' seconds', true);
            }
        } else if (isVoice(channel)) {
            embed
                .addField(bold('Bitrate:'),   channel.bitrate.toLocaleString(), true)
                .addField(bold('Full:'),      channel.full ? 'Yes' : 'No', true)
                .addField(bold('Max Users:'), channel.userLimit === 0 ? 'Unlimited' : `${channel.userLimit}`, true)
                .addField(bold('Region:'), channel.rtcRegion ?? 'Auto', true);
        }

        return padEmbedFields(embed);
    }
}