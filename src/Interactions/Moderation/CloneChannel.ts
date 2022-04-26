import { rest } from '#khaf/Bot';
import { Interactions } from '#khaf/Interaction';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { postToModLog } from '#khaf/utility/Discord/Interaction Util.js';
import { bold, inlineCode, time } from '@discordjs/builders';
import {
    ApplicationCommandOptionType,
    ChannelType,
    PermissionFlagsBits, Routes, type RESTPostAPIApplicationCommandsJSONBody, type RESTPostAPIGuildChannelJSONBody,
    type RESTPostAPIGuildChannelResult
} from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions, NewsChannel, TextChannel, VoiceChannel } from 'discord.js';

type CloneableChannel =
    | TextChannel
    | NewsChannel
    | VoiceChannel

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'clone-channel',
            description: 'Clones a channel.',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'channel',
                    description: 'The channel to clone.',
                    required: true,
                    channel_types: [
                        ChannelType.GuildText,
                        ChannelType.GuildNews,
                        ChannelType.GuildVoice
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'delete-old-channel',
                    description: 'Whether the channel being cloned should be deleted afterwards (defaults to false).'
                }
            ]
        };

        super(sc, {
            permissions: [
                // https://discord.com/developers/docs/resources/guild#create-guild-channel
                PermissionFlagsBits.ManageChannels
            ],
            defer: true
        });
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
        if (interaction.guildId === null) {
            return {
                content: '❌ I do not have full permissions in this guild, please re-invite with permission to manage channels.',
                ephemeral: true
            }
        }

        const channel = interaction.options.getChannel('channel', true) as CloneableChannel;
        const deleteAfterwards = interaction.options.getBoolean('delete-old-channel') ?? false;

        const isVoice = channel.type === ChannelType.GuildVoice;
        const isNews = channel.type === ChannelType.GuildNews;

        const body: RESTPostAPIGuildChannelJSONBody = {
            name: channel.name,
            type: channel.type,
            topic: !isVoice ? channel.topic : undefined,
            bitrate: isVoice ? channel.bitrate : undefined,
            user_limit: isVoice ? channel.userLimit : undefined,
            rate_limit_per_user: !isVoice && !isNews ? channel.rateLimitPerUser : undefined,
            position: channel.rawPosition,
            permission_overwrites: channel.permissionOverwrites.cache.toJSON().map(
                overwrite => ({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.bitfield.toString(),
                    deny: overwrite.deny.bitfield.toString()
                })
            ),
            parent_id: channel.parentId,
            nsfw: !isVoice ? channel.nsfw : undefined,
            default_auto_archive_duration: !isVoice ? channel.defaultAutoArchiveDuration : undefined
        };

        const clonedChannel = await rest.post(
            Routes.guildChannels(interaction.guildId),
            { body }
        ) as RESTPostAPIGuildChannelResult;

        const embed = Embed.json({
            color: colors.ok,
            description: `✅ Successfully cloned <#${clonedChannel.id}>` + (deleteAfterwards
                ? ` and I am in the process of deleting ${inlineCode(channel.name)} (${channel.id})!`
                : '!')
        });

        // The channel being deleted could be the current channel, which would cause
        // an error if we tried to response to the interaction. Therefore, send the
        // reply *before* deleting the channel.
        await interaction.editReply({ embeds: [embed] });

        if (deleteAfterwards) {
            // https://discord.com/developers/docs/resources/channel#deleteclose-channel
            await rest.delete(Routes.channel(channel.id));
        }

        // If the channel is private, we shouldn't broadcast
        // information about it.
        const everyone = channel.guild.roles.everyone.id;

        if (channel.permissionsFor(everyone)?.has(PermissionFlagsBits.ViewChannel)) {
            const embed = Embed.json({
                color: colors.ok,
                description: `
                ${bold('Channel:')} ${channel}
                ${bold('Staff:')} ${interaction.user}
                ${bold('Time:')} ${time(new Date())}`,
                title: 'Channel Cloned'
            });

            return void postToModLog(interaction, [embed]);
        }
    }
}