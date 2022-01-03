import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText, isThread } from '#khaf/utility/Discord.js';
import { postToModLog } from '#khaf/utility/Discord/Interaction Util.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { ApplicationCommandOptionType, ChannelType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, Permissions } from 'discord.js';
import { bold, time } from '@khaf/builders';

export class kInteraction extends Interactions {
    constructor() {
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
            defer: true,
            permissions: [
                Permissions.FLAGS.MANAGE_MESSAGES
            ]
        });
    }

    async init(interaction: CommandInteraction) {
        const amount = interaction.options.getInteger('messages', true);
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;

        if (!isText(channel) && !isThread(channel)) {
            return `❌ I can't bulk delete messages in ${channel}!`;
        } else if (!hasPerms(channel, interaction.guild?.me, this.options.permissions!)) {
            return `❌ Re-invite the bot with the correct permissions to use this command!`;
        }

        await dontThrow(channel.bulkDelete(amount));

        try {
            return `✅ Cleared ${amount} messages from ${channel}`;
        } finally {
            // If the channel is private, we shouldn't broadcast
            // information about it.

            const everyone = channel.guild.roles.everyone.id;
            
            if (channel.permissionsFor(everyone)?.has(Permissions.FLAGS.VIEW_CHANNEL)) {
                const embed = Embed.ok(`
                ${bold('Channel:')} ${channel}
                ${bold('Messages:')} ${amount}
                ${bold('Staff:')} ${interaction.user}
                ${bold('Time:')} ${time(new Date())}
                `).setTitle('Channel Messages Cleared');

                void postToModLog(interaction, [embed]);
            }
        }
    }
} 