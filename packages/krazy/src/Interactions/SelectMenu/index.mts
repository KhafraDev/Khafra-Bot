import {
  InteractionResponseType,
  MessageFlags,
  type APIInteractionResponse,
  type APIMessageComponentInteraction
} from 'discord-api-types/v10'
import { mdnSelectMenu } from './mdn.mjs'

export const handleSelectMenu = async (
  interaction: APIMessageComponentInteraction
): Promise<APIInteractionResponse | void> => {
  const { name } = JSON.parse(interaction.data.custom_id) as { name: string, id: string }

  switch (name) {
    case 'mdn':
      return await mdnSelectMenu.run(interaction)
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: 'Unknown interaction, sorry. :(',
      flags: MessageFlags.Ephemeral
    }
  }
}
