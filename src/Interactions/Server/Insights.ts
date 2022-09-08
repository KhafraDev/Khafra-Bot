import { Interactions } from '#khaf/Interaction'
import { toString } from '#khaf/utility/Permissions.js'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord-api-types/v10'

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'insights',
            description: 'Guild insight settings.',
            default_member_permissions: toString([PermissionFlagsBits.ViewGuildInsights]),
            dm_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'view',
                    description: 'Views the guild insights from the last two weeks!'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'today',
                    description: 'View the current insights for the day.'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'graph',
                    description: 'View a graph of the insights.'
                }
            ]
        }

        super(sc, {
            defer: true
        })
    }
}