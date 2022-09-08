import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { toString } from '#khaf/utility/Permissions.js'
import type {
    RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import {
    ApplicationCommandOptionType,
    PermissionFlagsBits
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

const perms = PermissionFlagsBits.Administrator

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'ban-by-name',
            description: 'Purge members with a given username.',
            default_member_permissions: toString([perms]),
            dm_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'username',
                    description: 'Username to purge.',
                    required: true
                }
            ]
        }

        super(sc)
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        if (!interaction.memberPermissions?.has(perms)) {
            if (interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
                return {
                    content: '❌ This command can be easily abused so only administrators can use this command.',
                    ephemeral: true
                }
            }

            return {
                content: '❌ You do not have permission to use this command!',
                ephemeral: true
            }
        } else if (
            interaction.guild === null ||
            !interaction.guild.members.me ||
            !interaction.guild.members.me.permissions.has(perms)
        ) {
            return {
                content: '❌ I do not have full permissions in this guild, please re-invite with permission to manage channels.',
                ephemeral: true
            }
        }

        await interaction.deferReply()

        let banned = ''
        const username = interaction.options.getString('username', true)
        const members = await interaction.guild.members.fetch({
            query: username,
            limit: 250
        })

        for (const member of members.values()) {
            if (member.bannable) {
                await member.ban()
                banned += `${member} (${member.user.tag})\n`
            }
        }

        return {
            embeds: [
                Embed.json({
                    color: colors.ok,
                    description: banned,
                    title: `Purged ${username} (${banned.split('\n').length} members)`,
                    footer: {
                        text: 'There may more more members with this username, it is recommended to run it again.'
                    }
                })
            ]
        }
    }
}