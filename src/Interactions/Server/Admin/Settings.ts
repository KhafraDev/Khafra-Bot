import { Interactions } from '#khaf/Interaction'
import { toString } from '#khaf/utility/Permissions.js'
import { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { sql } from '#khaf/database/Postgres.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold, inlineCode } from '@discordjs/builders'
import type { kGuild } from '#khaf/types/KhafraBot'

const ifNot = (label: string): (value: unknown) => string =>
    (value: unknown): string => inlineCode(`${value ?? label}`)

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'settings',
            description: 'Manage the bot\'s settings in your guild!',
            default_member_permissions: toString([PermissionFlagsBits.Administrator]),
            dm_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'max-warning-points',
                    description: 'The maximum warning points a member can receive before being kicked.',
                    min_value: 0,
                    max_value: 2 ** 15 - 1
                },
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'mod-logs-channel',
                    description: 'The channel where moderation logs are sent.',
                    channel_types: [
                        ChannelType.GuildAnnouncement,
                        ChannelType.GuildText
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'welcome-channel',
                    description: 'The channel where member join and leave messages are posted.',
                    channel_types: [
                        ChannelType.GuildAnnouncement,
                        ChannelType.GuildText
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'staff-channel',
                    description: 'Channel for general staff messages to be posted.',
                    channel_types: [
                        ChannelType.GuildAnnouncement,
                        ChannelType.GuildText
                    ]
                }
                // TODO: once tickets are added as interactions, add an option to change
                // ticket channel.
            ]
        }

        super(sc)
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        if (interaction.guild === null) {
            return {
                content: '❌ The bot is not in the guild, re-invite with the proper perms to change these settings!',
                ephemeral: true
            }
        }

        // The type needs to be downcasted on purpose. Expanding the
        // type causes the postgres types to error.
        const settings: Record<string, string | number | null | undefined> = {
            'max_warning_points': interaction.options.getInteger('max-warning-points'),
            'mod_log_channel': interaction.options.getChannel('mod-logs-channel')?.id,
            'welcome_channel': interaction.options.getChannel('welcome-channel')?.id,
            'staffChannel': interaction.options.getChannel('staff-channel')?.id
        }

        const keys = Object.keys(settings).filter(k => settings[k] != null)

        if (keys.length === 0) {
            const [guild] = await sql<kGuild[]>`
                SELECT * FROM kbGuild
                WHERE guild_id = ${interaction.guild.id}::text
                LIMIT 1;
            `

            const unset = ifNot('N/A (unset)')

            return {
                embeds: [
                    Embed.json({
                        color: colors.ok,
                        title: `✅ ${interaction.guild.name} Settings`,
                        description: `
                        ${bold('Warning Points Limit:')} ${unset(guild.max_warning_points)}
                        ${bold('Mod Logs:')} ${unset(guild.mod_log_channel)}
                        ${bold('Welcome Channel:')} ${unset(guild.welcome_channel)}
                        ${bold('Ticket Channel:')} ${unset(guild.ticketchannel)}
                        ${bold('Staff Channel:')} ${unset(guild.staffChannel)}
                        `
                    })
                ]
            }
        }

        // https://github.com/porsager/postgres#dynamic-columns-in-updates
        await sql`
            UPDATE kbGuild SET
            ${sql(settings, ...keys)}
            WHERE guild_id = ${interaction.guildId}::text;
        `

        return {
            embeds: [
                Embed.json({
                    color: colors.ok,
                    title: `✅ Updated ${keys.length} rows!`,
                    description: keys
                        .map(k => `- ${inlineCode(k)}: ${settings[k]}`)
                        .join('\n')
                })
            ]
        }
    }
}