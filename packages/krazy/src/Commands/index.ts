import {
  type APIApplicationCommandInteraction,
  type APIInteractionResponse,
  InteractionResponseType
} from 'discord-api-types/v10'
import { InteractionOptions } from '../lib/core/InteractionOptions.js'

import { command as InviteCommand } from './general/Invite.js'
import { command as MDNCommand } from './dev/MDN.js'
import { command as NPMCommand } from './dev/npm.js'
import { command as CratesIOCommand } from './dev/cratesio.js'

export const handleCommand = async (
  interaction: APIApplicationCommandInteraction,
  request: Request
): Promise<APIInteractionResponse> => {
  const options = new InteractionOptions(interaction.data)

  switch (interaction.data.name) {
    case 'invite':
      return InviteCommand.run(interaction, request, { options })
    case 'mdn':
      return MDNCommand.run(interaction, request, { options })
    case 'npm':
      return NPMCommand.run(interaction, request, { options })
    case 'crates':
      return CratesIOCommand.run(interaction, request, { options })
    default:
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: 'Unknown command'
        }
      }
  }
}
