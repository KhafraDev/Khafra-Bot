import { command as CratesIOCommand } from '#/commands/Commands/dev/cratesio.mjs'
import { command as MDNCommand } from '#/commands/Commands/dev/MDN.mjs'
import { command as NPMCommand } from '#/commands/Commands/dev/npm.mjs'
import { command as InviteCommand } from '#/commands/Commands/general/Invite.mjs'
import { InteractionOptions } from '#/core/InteractionOptions.mjs'
import {
  type APIApplicationCommandInteraction,
  type APIInteractionResponse,
  InteractionResponseType
} from 'discord-api-types/v10'

export const handleCommand = async (
  interaction: APIApplicationCommandInteraction
): Promise<APIInteractionResponse> => {
  const options = new InteractionOptions(interaction.data)

  switch (interaction.data.name) {
    case 'invite':
      return InviteCommand.run(interaction, { options })
    case 'mdn':
      return MDNCommand.run(interaction, { options })
    case 'npm':
      return NPMCommand.run(interaction, { options })
    case 'crates':
      return CratesIOCommand.run(interaction, { options })
    default:
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: 'Unknown command'
        }
      }
  }
}
