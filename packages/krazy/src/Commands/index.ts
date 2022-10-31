import {
  type APIApplicationCommandInteraction,
  type APIInteractionResponse,
  InteractionResponseType
} from 'discord-api-types/v10'

import { command as InviteCommand } from './general/Invite.js'
import { command as MDNCommand } from './dev/MDN.js'
import { command as NPMCommand } from './dev/npm.js'

export const handleCommand = async (
  interaction: APIApplicationCommandInteraction,
  request: Request
): Promise<APIInteractionResponse> => {
  switch (interaction.data.name) {
    case 'invite':
      return InviteCommand.run(interaction, request)
    case 'mdn':
      return MDNCommand.run(interaction, request)
    case 'npm':
      return NPMCommand.run(interaction, request)
    default:
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: 'Unknown command'
        }
      }
  }
}
