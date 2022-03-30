import { Interactions } from '#khaf/Interaction';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { inlineCode } from '@discordjs/builders';
import type {
    RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10';
import {
    ApplicationCommandOptionType,
    PermissionFlagsBits
} from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions, Role } from 'discord.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'addemoji',
            description: 'Adds an emoji to the server!',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'name',
                    description: 'The name of the emoji!',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Attachment,
                    name: 'emoji',
                    description: 'The emoji to add!',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'reason',
                    description: 'Reason for creating this emoji that will show in audit logs.'
                },
                {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role1',
                    description: 'Limit the emoji to this role.'
                },
                {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role2',
                    description: 'Limit the emoji to this role.'
                },
                {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role3',
                    description: 'Limit the emoji to this role.'
                },
                {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role4',
                    description: 'Limit the emoji to this role.'
                },
                {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role5',
                    description: 'Limit the emoji to this role.'
                }
            ]
        };

        super(sc, {
            permissions: [
                PermissionFlagsBits.ManageEmojisAndStickers
            ]
        });
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        if (!interaction.inCachedGuild()) {
            return {
                content: '❌ Please re-invite the bot with default permissions to use this command.',
                ephemeral: true
            }
        } else if (!hasPerms(interaction.channel, interaction.guild.me, this.options.permissions!)) {
            return {
                content: '❌ I need permission to manage emojis to use this command.',
                ephemeral: true
            }
        }

        const attachment = interaction.options.getAttachment('emoji', true);
        const name = interaction.options.getString('name', true);
        const reason = interaction.options.getString('reason') ?? undefined;
        const roles: Role[] = [];

        for (let i = 1; i <= 5; i++) {
            const role = interaction.options.getRole(`role${i}`);

            if (role) {
                roles.push(role);
            }
        }

        if (attachment.size > 256_000) {
            const kb = (attachment.size / 1000).toLocaleString(interaction.locale);
            return {
                content: `❌ Emoji must be under 256 KB in size (got ${inlineCode(kb)} kb).`,
                ephemeral: true
            }
        }

        const [err, emoji] = await dontThrow(interaction.guild.emojis.create(
            attachment.proxyURL,
            name,
            { reason, roles }
        ));

        if (err !== null) {
            return {
                content: `❌ An unexpected error has occurred: ${inlineCode(err.message)}`,
                ephemeral: true
            }
        }

        return {
            content: `${emoji} is now a guild emoji!`
        }
    }
}