import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed, EmbedUtil, padEmbedFields } from '#khaf/utility/Constants/Embeds.js';
import { isExplicitText, isText, isVoice } from '#khaf/utility/Discord.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { bold, codeBlock, time } from '@discordjs/builders';
import type { APIEmbed} from 'discord-api-types/v10';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get info on a specified channel!',
                '#general',
                '705896160673661041'
            ],
            {
                name: 'channel',
                folder: 'Server',
                aliases: ['chan', 'channelinfo'],
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init (message: Message<true>, { content }: Arguments): Promise<APIEmbed> {
        const channel =
            await getMentions(message, 'channels') ??
            message.guild.channels.cache.find(c => c.name.toLowerCase() === content.toLowerCase()) ??
            message.channel;

        if (!hasPerms(channel, message.member, PermissionFlagsBits.ViewChannel)) {
            return Embed.error('No channel with that name was found!');
        }

        const embed = EmbedUtil.addFields(
            Embed.ok(),
            { name: bold('ID:'), value: channel.id, inline: true },
            { name: bold('Type:'), value: `${channel.type}`, inline: true },
            {
                name: bold('Created:'),
                value: channel.createdAt ? time(channel.createdAt, 'f') : 'Unknown!',
                inline: true
            }
        );

        if (isText(channel)) {
            EmbedUtil.setDescription(
                embed,
                `${channel}
                ${channel.topic ? codeBlock(`${channel.topic}`) : ''}`
            );
            EmbedUtil.addFields(
                embed,
                { name: bold('Name:'), value: channel.name, inline: true },
                { name: bold('Parent:'), value: channel.parent ? `${channel.parent}` : 'None', inline: true },
                { name: bold('NSFW:'), value: channel.nsfw ? 'Yes' : 'No', inline: true },
                { name: bold('Position:'), value: `${channel.position}`, inline: true }
            );

            if (isExplicitText(channel)) {
                EmbedUtil.addFields(
                    embed,
                    {
                        name: bold('Rate-Limit:'),
                        value: channel.rateLimitPerUser + ' seconds',
                        inline: true
                    }
                );
            }
        } else if (isVoice(channel)) {
            EmbedUtil.addFields(
                embed,
                { name: bold('Bitrate:'), value: channel.bitrate.toLocaleString(), inline: true },
                { name: bold('Full:'), value: channel.full ? 'Yes' : 'No', inline: true },
                {
                    name: bold('Max Users:'),
                    value: channel.userLimit === 0 ? 'Unlimited': `${channel.userLimit}`,
                    inline: true
                },
                { name: bold('Region:'), value: channel.rtcRegion ?? 'Auto', inline: true }
            );
        }

        return padEmbedFields(embed);
    }
}