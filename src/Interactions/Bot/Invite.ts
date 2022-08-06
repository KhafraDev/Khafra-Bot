import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold } from '@discordjs/builders'
import { OAuth2Scopes, PermissionFlagsBits, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

const scopes = [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands]
const permissions = [
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.CreateInstantInvite,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageEmojisAndStickers,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ModerateMembers,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.SendMessages
]

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'invite',
            description: 'Get a link to invite the bot.'
        }

        super(sc)
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const everything = interaction.client.generateInvite({ scopes, permissions })
        const slashCommands = interaction.client.generateInvite({ scopes, permissions: 0n })

        return {
            embeds: [
                Embed.json({
                    color: colors.ok,
                    fields: [
                        { name: bold('Everything:'), value: everything },
                        { name: bold('Enable slash commands and buttons only:'), value: slashCommands }
                    ]
                })
            ]
        }
    }
}