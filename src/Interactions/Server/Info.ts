import { client } from '#khaf/Client';
import { Interactions } from '#khaf/Interaction';
import { logger } from '#khaf/Logger';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { once } from '#khaf/utility/Memoize.js';
import { bold, inlineCode, italic, time } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ActivityType, ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { Activity, ChatInputCommandInteraction, InteractionReplyOptions, Snowflake, UserFlagsString } from 'discord.js';
import { GuildMember, Role, SnowflakeUtil, User } from 'discord.js';
import { join } from 'node:path';

const formatPresence = (activities: Activity[] | undefined): string => {
    if (!Array.isArray(activities)) return '';

    const push: string[] = [];
    for (const activity of activities) {
        switch (activity.type) {
            case ActivityType.Custom: {
                push.push(`${activity.emoji ?? ''}${inlineCode(activity.state ?? 'N/A')}`);
                break;
            }
            case ActivityType.Listening: {
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`);
                break;
            }
            case ActivityType.Playing: {
                push.push(`Playing ${italic(activity.name)}.`);
                break;
            }
            case ActivityType.Streaming: {
                const details = activity.details ?? activity.url;
                push.push(`Streaming ${bold(activity.state ?? 'N/A')} on ${activity.name}${details ? `- ${inlineCode(details)}` : ''}`);
                break;
            }
            case ActivityType.Watching: {
                push.push(`Watching ${bold(activity.name)}${activity.url ? `at ${activity.url}` : ''}`);
                break;
            }
            default:
                logger.log(activity);
        }
    }

    return push.join('\n');
}

const config = createFileWatcher({} as typeof import('../../../config.json'), join(cwd, 'config.json'));

const emojis = new Map<UserFlagsString, string | undefined>();
// lazy load emojis
const getEmojis = once(() => {
    const flags = Object.entries(config.emoji.flags) as [UserFlagsString, Snowflake][];
    for (const [flag, emojiID] of flags)
    // not ruling out the possibility of the emoji not being cached
        emojis.set(flag, client.emojis.cache.get(emojiID)?.toString());

    return emojis;
});

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'info',
            description: 'Gets info about a user, guild member, channel, or role.',
            options: [
                {
                    type: ApplicationCommandOptionType.Mentionable,
                    name: 'type',
                    description: 'Type of Discord object to get information for.',
                    required: true
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const option = interaction.options.getMentionable('type', true);

        if (option instanceof GuildMember) {
            const embed = Embed.ok()
                .setAuthor({
                    name: option.displayName,
                    iconURL: option.user.displayAvatarURL()
                })
                .setDescription(`
                ${option} on ${italic(option.guild.name)}.
                ${formatPresence(option.presence?.activities)}
                
                Roles:
                ${[...option.roles.cache.filter(r => r.name !== '@everyone').values()].slice(0, 20).join(', ')}
                `)
                .setThumbnail(option.user.displayAvatarURL())
                .addFields(
                    { name: bold('Role Color:'), value: option.displayHexColor, inline: true },
                    { name: bold('Joined Guild:'), value: time(option.joinedAt ?? new Date()), inline: false },
                    {
                        name: bold('Boosting Since:'),
                        value: option.premiumSince ? time(option.premiumSince) : 'Not boosting',
                        inline: true
                    }
                )
                .setFooter({ text: 'For general user info mention a user!' });

            return {
                embeds: [embed]
            }
        } else if (option instanceof Role) {
            const embed = Embed.ok()
                .setDescription(`
                ${option}
                
                Permissions: 
                ${inlineCode(option.permissions.toArray().join(', '))}
                `)
                .addFields(
                    { name: bold('Name:'), value: option.name, inline: true },
                    { name: bold('Color:'), value: option.hexColor, inline: true },
                    { name: bold('Created:'), value: time(option.createdAt), inline: true },
                    { name: bold('Mentionable:'), value: option.mentionable ? 'Yes' : 'No', inline: true },
                    { name: bold('Hoisted:'), value: option.hoist ? 'Yes' : 'No', inline: true },
                    { name: bold('Position:'), value: `${option.position}`, inline: true },
                    { name: bold('Managed:'), value: option.managed ? 'Yes' : 'No' }
                );

            if (option.icon) {
                embed.setImage(option.iconURL());
            }

            return {
                embeds: [embed]
            }
        } else if (option instanceof User) {
            const member = option.equals(interaction.user)
                ? interaction.member
                : interaction.guild?.members.resolve(option);
            const guildMember = member instanceof GuildMember
                ? member
                : null;

            const snowflake = SnowflakeUtil.timestampFrom(option.id);
            const flags = option.flags?.bitfield
                ? option.flags.toArray()
                : [];

            const emojis = flags
                .filter(f => getEmojis()?.has(f))
                .map(f => getEmojis()?.get(f));

            const embed = Embed.ok(formatPresence(guildMember?.presence?.activities))
                .setAuthor({
                    name: option.tag,
                    iconURL: option.displayAvatarURL()
                })
                .addFields(
                    { name: bold('Username:'), value: option.username, inline: true },
                    { name: bold('ID:'), value: option.id, inline: true },
                    { name: bold('Discriminator:'), value: `#${option.discriminator}`, inline: true },
                    { name: bold('Bot:'), value: option.bot ? 'Yes' : 'No', inline: true },
                    { name: bold('Badges:'), value: `${emojis.length > 0 ? emojis.join(' ') : 'None/Unknown'}`, inline: true },
                    { name: bold('Account Created:'), value: time(Math.floor(snowflake / 1000)), inline: true }
                );

            return {
                embeds: [embed]
            }
        }
    }
}