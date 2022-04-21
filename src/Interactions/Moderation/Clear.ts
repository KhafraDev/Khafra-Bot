import { Interactions } from '#khaf/Interaction';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText, isThread } from '#khaf/utility/Discord.js';
import { postToModLog } from '#khaf/utility/Discord/Interaction Util.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { bold, time } from '@discordjs/builders';
import type {
    RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10';
import {
    ApplicationCommandOptionType,
    ChannelType,
    PermissionFlagsBits
} from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { setTimeout } from 'node:timers/promises';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'clear',
            description: 'Bulk deletes messages from a channel.',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'messages',
                    description: 'Number of messages to clear.',
                    required: true,
                    min_value: 1,
                    max_value: 100
                },
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'channel',
                    description: 'The channel to delete the messages from (defaults to current channel).',
                    channel_types: [
                        ChannelType.GuildText,
                        ChannelType.GuildNews,
                        ChannelType.GuildNewsThread,
                        ChannelType.GuildPublicThread,
                        ChannelType.GuildPrivateThread
                    ]
                }
            ]
        };

        super(sc, {
            permissions: [
                PermissionFlagsBits.ManageMessages
            ]
        });
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
        const amount = interaction.options.getInteger('messages', true);
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;

        if (!isText(channel) && !isThread(channel)) {
            return {
                content: `❌ I can't bulk delete messages in ${channel}!`,
                ephemeral: true
            }
        } else if (!hasPerms(channel, interaction.guild?.me, this.options.permissions!)) {
            return {
                content: '❌ Re-invite the bot with the correct permissions to use this command!',
                ephemeral: true
            }
        }

        await interaction.reply({
            content: `✅ Deleting ${amount} messages in ${channel} in a few seconds!`
        });
        await setTimeout(5_000);
        await interaction.deleteReply();
        await dontThrow(channel.bulkDelete(amount));

        // If the channel is private, we shouldn't broadcast
        // information about it.

        const everyone = channel.guild.roles.everyone.id;

        if (channel.permissionsFor(everyone)?.has(PermissionFlagsBits.ViewChannel)) {
            const embed = Embed.json({
                color: colors.ok,
                description: `
                ${bold('Channel:')} ${channel}
                ${bold('Messages:')} ${amount}
                ${bold('Staff:')} ${interaction.user}
                ${bold('Time:')} ${time(new Date())}`,
                title: 'Channel Messages Cleared'
            });

            return void postToModLog(interaction, [embed]);
        }
    }
}