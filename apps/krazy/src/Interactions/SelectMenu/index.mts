import { mdnSelectMenu } from '#/commands/SelectMenu/mdn.mjs'
import {
  type APIInteractionResponse,
  type APIMessageComponentInteraction,
  InteractionResponseType,
  MessageFlags
} from 'discord-api-types/v10'

export const handleSelectMenu = async (
  interaction: APIMessageComponentInteraction
): Promise<APIInteractionResponse | void> => {
  const { name } = JSON.parse(interaction.data.custom_id) as { name: string; id: string }

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
