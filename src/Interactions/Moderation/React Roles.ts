import { Interactions } from '#khaf/Interaction';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { ActionRow, Embed as MessageEmbed, inlineCode } from '@khaf/builders';
import { ApplicationCommandOptionType, ChannelType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import {
    ChatInputCommandInteraction,
    EmojiIdentifierResolvable,
    GuildMember,
    GuildMemberRoleManager,
    NewsChannel,
    Permissions,
    Role,
    TextChannel,
    ThreadChannel,
    Util
} from 'discord.js';
import { parse } from 'twemoji-parser';

type Channel = TextChannel | NewsChannel | ThreadChannel;

const guildEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/g;
const perms = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES
]);

export class kInteraction extends Interactions {
    constructor() {
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
                Permissions.FLAGS.MANAGE_ROLES
            ]
        });
    }

    async init(interaction: ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel('channel', true) as Channel;
        const role = interaction.options.getRole('role', true);
        const icon = interaction.options.getString('icon');
        const text =
            interaction.options.getString('message') ??
            `Press the button below to get the ${role} role!
            
            Clicking the button again will take the role away!`;

        if (!hasPerms(channel, interaction.guild?.me, perms)) { 
            return `❌ I do not have permission to post a message in this channel!`;
        } else if (!hasPerms(channel, interaction.member, perms)) { 
            return `❌ You do not have permission to post a message in this channel!`;
        } else if (role.managed) {
            return `❌ I can't give members a managed role.`;
        } else if (
            !(role instanceof Role) ||
            !(interaction.member instanceof GuildMember) ||
            !(interaction.member.roles instanceof GuildMemberRoleManager) ||
            !interaction.guild?.me
        ) {
            return `❌ You need to re-invite me with the proper permissions (click the "Add to Server" button on my profile)!`;
        } else if (
            role.id === interaction.guild.me.roles.highest.id ||
            // Negative if this role's position is lower (param is higher),
            // positive number if this one is higher (other's is lower), 0 if equal
            role.comparePositionTo(interaction.guild.me.roles.highest) > 0
        ) {
            return `❌ I do not have enough permission to give others this role!`;
        } else if (
            role.id === interaction.member.roles.highest.id ||
            role.comparePositionTo(interaction.member.roles.highest) > 0
        ) {
            return `❌ You cannot give this role out to others!`;
        }

        let emoji: EmojiIdentifierResolvable | undefined;
        if (icon) {
            if (guildEmojiRegex.test(icon)) {
                // The parsing is handled by Util.parseEmoji
                // https://github.com/discordjs/discord.js/blob/2f6f365098cbab397cda124711c4bb08da850a17/src/util/Util.js#L297
                emoji = icon;
            } else {
                const parsed = parse(icon);

                if (parsed.length !== 0) {
                    emoji = parsed[0].text;
                }
            }
        }

        const component = Components.approve(`Get ${role.name}`.slice(0, 80), role.id);
        if (emoji) {
            if (typeof emoji === 'string') {
                component.setEmoji({ name: emoji });
            } else {
                component.setEmoji({
                    name: emoji.name ?? undefined,
                    animated: emoji.animated ?? undefined,
                    id: emoji.id ?? undefined
                });
            }
        }

        const [err, message] = await dontThrow(channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(Util.resolveColor(role.hexColor))
                    .setDescription(text)
            ],
            components: [
                new ActionRow().addComponents(
                    component
                )
            ]
        }));

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        }

        return Embed.ok(`Ok! Click [the button here](${message?.url}) to get the ${role} role!`);
    }
} 