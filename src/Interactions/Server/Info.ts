import { client } from '#khaf/Client';
import { Interactions } from '#khaf/Interaction';
import { logger } from '#khaf/Logger';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { once } from '#khaf/utility/Memoize.js';
import { bold, inlineCode, italic, time } from '@khaf/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { Activity, CommandInteraction, GuildMember, Role, Snowflake, SnowflakeUtil, User, UserFlagsString } from 'discord.js';
import { join } from 'path';

const formatPresence = (activities: Activity[] | undefined) => {
    if (!Array.isArray(activities)) return '';
    
    const push: string[] = [];
    for (const activity of activities) {
        switch (activity.type) {
            case 'CUSTOM':
                push.push(`${activity.emoji ?? ''}${inlineCode(activity.state ?? 'N/A')}`); 
                break;
            case 'LISTENING':
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); 
                break;
            case 'PLAYING':
                push.push(`Playing ${italic(activity.name)}.`); 
                break;
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

    async init(interaction: CommandInteraction) {
        const option = interaction.options.getMentionable('type', true);

        if (option instanceof GuildMember) {
            return Embed.ok()
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
                    },
                )
                .setFooter({ text: 'For general user info use the /user command!' });
        } else if (option instanceof Role) {
            const embed = Embed.ok()
                .setDescription(`
                ${option}
                
                Permissions: 
                ${inlineCode(option.permissions.toArray().join(', '))}
                `)
                .addField(bold('Name:'), option.name, true)
                .addField(bold('Color:'), option.hexColor, true)
                .addField(bold('Created:'), time(option.createdAt), true)
                .addField(bold('Mentionable:'), option.mentionable ? 'Yes' : 'No', true)
                .addField(bold('Hoisted:'), option.hoist ? 'Yes' : 'No', true)
                .addField(bold('Position:'), `${option.position}`, true)
                .addField(bold('Managed:'), option.managed ? 'Yes' : 'No');

            if (option.icon) {
                embed.setImage(option.iconURL()!);
            }

            return embed;
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
                .filter(f => getEmojis().has(f))
                .map(f => getEmojis().get(f));

            return Embed.ok(formatPresence(guildMember?.presence?.activities) ?? undefined)
                .setAuthor({
                    name: option.tag, 
                    iconURL: option.displayAvatarURL() ?? client.user!.displayAvatarURL()
                })
                .addField(bold('Username:'), option.username, true)
                .addField(bold('ID:'), option.id, true)
                .addField(bold('Discriminator:'), `#${option.discriminator}`, true)
                .addField(bold('Bot:'), option.bot != undefined ? option.bot ? 'Yes' : 'No' : 'Unknown', true)
                .addField(bold('Badges:'), `${emojis.length > 0 ? emojis.join(' ') : 'None/Unknown'}`, true)
                .addField(bold('Account Created:'), time(Math.floor(snowflake / 1000)), true);
        }
    }
} 