import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, GuildMember, GuildMemberRoleManager, MessageActionRow, MessageEmbed, Permissions, Role } from 'discord.js';
import { isTextBased } from '../../lib/types/Discord.js.js';
import { Components } from '../../lib/Utility/Constants/Components.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Interactions } from '../../Structures/Interaction.js';

const perms = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.VIEW_CHANNEL
])

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
                    required: true
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
                }
            ]
        };

        super(sc, {
            permissions: [
                Permissions.FLAGS.MANAGE_ROLES
            ]
        });
    }

    async init(interaction: CommandInteraction) {
        const channel = interaction.options.getChannel('channel', true);
        const role = interaction.options.getRole('role', true);
        const text =
            interaction.options.getString('message') ??
            `Press the button below to get the ${role} role!
            
            Clicking the button again will take the role away!`;

        if (!isTextBased(channel)) {
            return `❌ I can't send messages into this type of channel, try a text, news, or thread channel instead!`;
        } else if (!hasPerms(channel, interaction.guild?.me, perms)) { 
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

        const message = await interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(role.hexColor)
                    .setDescription(text)
            ],
            components: [
                new MessageActionRow().addComponents(
                    Components.approve(`Get ${role.name}`.slice(0, 80), role.id)
                )
            ],
            fetchReply: true
        });

        const url = 'url' in message
            ? message.url
            : `https://discord.com/channels/${message.guild_id ?? '@me'}/${message.channel_id}/${message.id}`;

        return Embed.ok(`Ok! Click [the button here](${url}) to get the ${role} role!`);
    }
} 