import { Activity, CommandInteraction, GuildMember, Role, Snowflake, SnowflakeUtil, User, UserFlagsString } from 'discord.js';
import { bold, inlineCode, SlashCommandBuilder, time } from '@discordjs/builders';
import { join } from 'path';
import { Interactions } from '../../Structures/Interaction.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { cwd } from '../../lib/Utility/Constants/Path.js';
import { createFileWatcher } from '../../lib/Utility/FileWatcher.js';
import { once } from '../../lib/Utility/Memoize.js';
import { client } from '../../index.js';

const formatPresence = (activities: Activity[] | undefined) => {
    if (!Array.isArray(activities)) return '';
    
    const push: string[] = [];
    for (const activity of activities) {
        switch (activity.type) {
            case 'CUSTOM':
                push.push(`${activity.emoji ?? ''}\`\`${activity.state ?? 'N/A'}\`\``); 
                break;
            case 'LISTENING':
                push.push(`Listening to ${activity.details} - ${activity.state ?? 'N/A'} on ${activity.name}.`); 
                break;
            case 'PLAYING':
                push.push(`Playing *${activity.name}*.`); 
                break;
            default:
                console.log(activity);
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
        const sc = new SlashCommandBuilder()
            .setName('info')
            .addMentionableOption(option => option
                .setName('type')
                .setDescription('Information to fetch.')
                .setRequired(true)    
            )
            .setDescription('Get info about a user, guild member, channel, or role.');

        super(sc);
    }

    async init(interaction: CommandInteraction) {
        const option = interaction.options.getMentionable('type', true);

        if (option instanceof GuildMember) {
            return Embed.success()
                .setAuthor(option.displayName, option.user.displayAvatarURL())
                .setDescription(`
                ${option} on *${option.guild.name}*.
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
                .setFooter('For general user info use the /user command!');
        } else if (option instanceof Role) {
            return Embed.success()
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
        } else if (option instanceof User) {
            const member = option.equals(interaction.user) 
                ? interaction.member
                : interaction.guild?.members.resolve(option);
            const guildMember = member instanceof GuildMember
                ? member
                : null;

            const snowflake = SnowflakeUtil.deconstruct(option.id);
            const flags = option.flags?.bitfield
                ? option.flags.toArray()
                : [];

            const emojis = flags
                .filter(f => getEmojis().has(f))
                .map(f => getEmojis().get(f));

            return Embed.success(formatPresence(guildMember?.presence?.activities) ?? undefined)
                .setAuthor(option.tag, option.displayAvatarURL() ?? client.user!.displayAvatarURL())
                .addField(bold('Username:'), option.username, true)
                .addField(bold('ID:'), option.id, true)
                .addField(bold('Discriminator:'), `#${option.discriminator}`, true)
                .addField(bold('Bot:'), option.bot != undefined ? option.bot ? 'Yes' : 'No' : 'Unknown', true)
                .addField(bold('Badges:'), `${emojis.length > 0 ? emojis.join(' ') : 'None/Unknown'}`, true)
                .addField(bold('Account Created:'), time(snowflake.date), true);
        }
    }
} 