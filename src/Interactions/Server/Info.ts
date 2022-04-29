import { client } from '#khaf/Client';
import { Interactions } from '#khaf/Interaction';
import { logger } from '#khaf/Logger';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { parseEmojiList } from '#khaf/utility/Emoji.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { once } from '#khaf/utility/Memoize.js';
import { bold, inlineCode, italic, time } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ActivityType, ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { Activity, ChatInputCommandInteraction, InteractionReplyOptions, Snowflake, UserFlagsString } from 'discord.js';
import { GuildMember, Role, SnowflakeUtil, User } from 'discord.js';
import { join } from 'node:path';
import { parse, toCodePoints } from 'twemoji-parser';

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

// lazy load emojis
const getEmojis = once(() => {
    const flags = Object.entries(config.emoji.flags) as [UserFlagsString, Snowflake][];
    for (const [flag, emojiID] of flags)
    // not ruling out the possibility of the emoji not being cached
        emojis.set(flag, client.emojis.cache.get(emojiID)?.toString());

    return emojis;
});

const GUILD_EMOJI_REG = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/;
const config = createFileWatcher({} as typeof import('../../../config.json'), join(cwd, 'config.json'));
const emojis = new Map<UserFlagsString, string | undefined>();

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'info',
            description: 'Gets info about a user, guild member, channel, or role.',
            options: [
                {
                    type: ApplicationCommandOptionType.Mentionable,
                    name: 'type',
                    description: 'Type of Discord object to get information for.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'emoji',
                    description: 'A guild emoji or unicode emoji to get the information of.'
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const option =
            interaction.options.getMentionable('type') ??
            interaction.options.getString('emoji') ??
            interaction.user;
        const createdAt = typeof option === 'string'
            ? null
            : 'joined_at' in option
                ? new Date(option.joined_at)
                : new Date(SnowflakeUtil.timestampFrom(option.id));

        if (typeof option === 'string') {
            if (GUILD_EMOJI_REG.test(option)) {
                const { animated, name, id } = GUILD_EMOJI_REG.exec(option)!.groups as {
                    animated: 'a' | undefined
                    name: string
                    id: string
                };

                const url = `https://cdn.discordapp.com/emojis/${id}.webp`;
                const createdAt = new Date(SnowflakeUtil.timestampFrom(id));
                const embed = Embed.json({
                    color: colors.ok,
                    description: option,
                    title: name,
                    image: { url },
                    fields: [
                        { name: bold('ID:'), value: id, inline: true },
                        { name: bold('Name:'), value: name, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: bold('Animated:'), value: animated === 'a' ? 'Yes' : 'No', inline: true },
                        { name: bold('Created:'), value: time(createdAt, 'f'), inline: true },
                        { name: '\u200b', value: '\u200b', inline: true }
                    ]
                });

                return {
                    embeds: [embed]
                }
            }

            const unicodeEmoji = parse(option, { assetType: 'png' });
            const cache = await parseEmojiList();

            if (unicodeEmoji.length === 0) {
                return {
                    content: '❌ No emojis were found in your message.',
                    ephemeral: true
                }
            } else if (cache === null) {
                return {
                    content: '❌ Emojis are being cached, please re-run this command in a minute!',
                    ephemeral: true
                }
            }

            const codePoints = toCodePoints(unicodeEmoji[0].text);
            const key = codePoints.join(' ').toUpperCase();

            if (!cache.has(key)) {
                return {
                    embeds: [
                        Embed.json({
                            color: colors.error,
                            description: '❌ This emoji is invalid or unsupported!'
                        })
                    ],
                    ephemeral: true
                }
            }

            const emoji = cache.get(key)!;
            const embed = Embed.json({
                color: colors.ok,
                description: unicodeEmoji[0].text,
                image: { url: unicodeEmoji[0].url },
                fields: [
                    { name: bold('Name:'), value: emoji.comment, inline: true },
                    { name: bold('Category:'), value: emoji.group, inline: true },
                    { name: bold('Unicode:'), value: emoji.codePoints, inline: true }
                ]
            });

            return {
                embeds: [embed]
            }
        } else if (option instanceof GuildMember) {
            const embed = Embed.json({
                color: colors.ok,
                author: {
                    name: option.displayName,
                    icon_url: option.user.displayAvatarURL()
                },
                description: `
                ${option} on ${italic(option.guild.name)}.
                ${formatPresence(option.presence?.activities)}
                
                Roles:
                ${[...option.roles.cache.filter(r => r.name !== '@everyone').values()].slice(0, 20).join(', ')}
                `,
                thumbnail: { url: option.user.displayAvatarURL() },
                fields: [
                    { name: bold('Role Color:'), value: option.displayHexColor, inline: true },
                    { name: bold('Joined Guild:'), value: time(option.joinedAt ?? new Date()), inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    {
                        name: bold('Boosting Since:'),
                        value: option.premiumSince ? time(option.premiumSince) : 'Not boosting',
                        inline: true
                    },
                    { name: bold('Account Created:'), value: time(createdAt!, 'f'), inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }
                ],
                footer: { text: 'For general user info mention a user!' }
            });

            return {
                embeds: [embed]
            }
        } else if (option instanceof Role) {
            const embed = Embed.json({
                color: colors.ok,
                description: `
                ${option}
                
                Permissions: 
                ${inlineCode(option.permissions.toArray().join(', '))}
                `,
                fields: [
                    { name: bold('Name:'), value: option.name, inline: true },
                    { name: bold('Color:'), value: option.hexColor, inline: true },
                    { name: bold('Created:'), value: time(option.createdAt), inline: true },
                    { name: bold('Mentionable:'), value: option.mentionable ? 'Yes' : 'No', inline: true },
                    { name: bold('Hoisted:'), value: option.hoist ? 'Yes' : 'No', inline: true },
                    { name: bold('Position:'), value: `${option.position}`, inline: true },
                    { name: bold('Managed:'), value: option.managed ? 'Yes' : 'No', inline: true }
                ],
                image: option.icon ? { url: option.iconURL()! } : undefined
            });

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

            const flags = option.flags?.bitfield
                ? option.flags.toArray()
                : [];

            const emojis = flags
                .filter(f => getEmojis()?.has(f))
                .map(f => getEmojis()?.get(f));

            const embed = Embed.json({
                color: colors.ok,
                description: formatPresence(guildMember?.presence?.activities),
                author: {
                    name: option.tag,
                    icon_url: option.displayAvatarURL()
                },
                fields: [
                    { name: bold('Username:'), value: option.username, inline: true },
                    { name: bold('ID:'), value: option.id, inline: true },
                    { name: bold('Discriminator:'), value: `#${option.discriminator}`, inline: true },
                    { name: bold('Bot:'), value: option.bot ? 'Yes' : 'No', inline: true },
                    { name: bold('Badges:'), value: `${emojis.length > 0 ? emojis.join(' ') : 'None/Unknown'}`, inline: true },
                    { name: bold('Account Created:'), value: time(createdAt!, 'f'), inline: true }
                ]
            });

            return {
                embeds: [embed]
            }
        }
    }
}