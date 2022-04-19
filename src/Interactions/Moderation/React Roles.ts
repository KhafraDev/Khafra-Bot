import { Interactions } from '#khaf/Interaction';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import type { MessageActionRowComponentBuilder} from '@discordjs/builders';
import { ActionRowBuilder, inlineCode } from '@discordjs/builders';
import type {
    RESTPostAPIApplicationCommandsJSONBody,
    Snowflake
} from 'discord-api-types/v10';
import {
    ApplicationCommandOptionType,
    ChannelType,
    PermissionFlagsBits
} from 'discord-api-types/v10';
import type {
    ChatInputCommandInteraction,
    InteractionReplyOptions,
    NewsChannel,
    TextChannel,
    ThreadChannel} from 'discord.js';
import {
    GuildMember,
    GuildMemberRoleManager,
    Role,
    Util
} from 'discord.js';
import { parse } from 'twemoji-parser';

type Channel = TextChannel | NewsChannel | ThreadChannel;

interface GuildMatchGroups {
    animated: undefined | 'a'
    name: string
    id: Snowflake
}

const guildEmojiRegex = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/;
const perms = PermissionFlagsBits.SendMessages;

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'reactrole',
            description: 'Add a button that gives members a specified role when clicked on!',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'channel',
                    description: 'Channel to post the message into.',
                    required: true,
                    channel_types: [
                        ChannelType.GuildText,
                        ChannelType.GuildNews,
                        ChannelType.GuildNewsThread,
                        ChannelType.GuildPublicThread,
                        ChannelType.GuildPrivateThread
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role',
                    description: 'The role to apply when clicking on the button.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'message',
                    description: 'The text the button message will display.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'icon',
                    description: 'The icon the button should display.'
                }
                // once repeating choices are added, allow multiple roles!!!
            ]
        };

        super(sc, {
            permissions: [
                PermissionFlagsBits.ManageRoles
            ]
        });
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const channel = interaction.options.getChannel('channel', true) as Channel;
        const role = interaction.options.getRole('role', true);
        const icon = interaction.options.getString('icon');
        const text =
            interaction.options.getString('message') ??
            `Press the button below to get the ${role} role!
            
            Clicking the button again will take the role away!`;

        if (!hasPerms(channel, interaction.guild?.me, perms)) {
            return {
                content: '❌ I do not have permission to post a message in this channel!',
                ephemeral: true
            }
        } else if (!hasPerms(channel, interaction.member, perms)) {
            return {
                content: '❌ You do not have permission to post a message in this channel!',
                ephemeral: true
            }
        } else if (role.managed) {
            return {
                content: '❌ I can\'t give members a managed role.',
                ephemeral: true
            }
        } else if (
            !(role instanceof Role) ||
            !(interaction.member instanceof GuildMember) ||
            !(interaction.member.roles instanceof GuildMemberRoleManager) ||
            !interaction.guild?.me
        ) {
            return {
                content: '❌ You need to re-invite me with the proper permissions (click the "Add to Server" button on my profile)!',
                ephemeral: true
            }
        } else if (
            role.id === interaction.guild.me.roles.highest.id ||
            // Negative if this role's position is lower (param is higher),
            // positive number if this one is higher (other's is lower), 0 if equal
            role.comparePositionTo(interaction.guild.me.roles.highest) > 0
        ) {
            return {
                content: '❌ I do not have enough permission to give others this role!',
                ephemeral: true
            }
        } else if (
            role.id === interaction.member.roles.highest.id ||
            role.comparePositionTo(interaction.member.roles.highest) > 0
        ) {
            return {
                content: '❌ You cannot give this role out to others!',
                ephemeral: true
            }
        }

        const component = Components.approve(`Get ${role.name}`.slice(0, 80), role.id);

        if (icon) {
            if (guildEmojiRegex.test(icon)) {
                const match = guildEmojiRegex.exec(icon) as RegExpExecArray & { groups: GuildMatchGroups };
                component.setEmoji({
                    animated: match.groups.animated ? true : undefined,
                    id: match.groups.id,
                    name: match.groups.name
                });
            } else {
                const parsed = parse(icon);

                if (parsed.length !== 0) {
                    component.setEmoji({ name: parsed[0].text });
                }
            }
        }

        const [err, message] = await dontThrow(channel.send({
            embeds: [
                Embed.json({
                    color: Util.resolveColor(role.hexColor),
                    description: text
                })
            ],
            components: [
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    component
                )
            ]
        }));

        if (err !== null) {
            return {
                content: `❌ An unexpected error occurred: ${inlineCode(err.message)}`,
                ephemeral: true
            }
        }

        return {
            embeds: [
                Embed.ok(`Ok! Click [the button here](${message.url}) to get the ${role} role!`)
            ]
        }
    }
}