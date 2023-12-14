import { routes } from '#/lib/constants.mjs'
import {
  type APIInteraction,
  type APIMessage,
  InteractionResponseType,
  type RESTPatchAPIWebhookWithTokenMessageJSONBody,
  Routes
} from 'discord-api-types/v10'

export const time = (unix: Date, format: string): string => `<t:${Math.floor(unix.getTime() / 1000)}:${format}>`

export function assert(condition: unknown): asserts condition {
  if (!condition) {
    throw new Error('false condition')
  }
}

// https://discord.com/developers/docs/interactions/receiving-and-responding#create-interaction-response
export const deferInteraction = async (interaction: APIInteraction): Promise<boolean> => {
  const path = Routes.interactionCallback(interaction.id, interaction.token)
  const response = await fetch(`${routes.discord}${path}`, {
    method: 'POST',
    body: JSON.stringify({
      type: InteractionResponseType.DeferredChannelMessageWithSource
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response.status === 204
}

// https://discord.com/developers/docs/interactions/receiving-and-responding#edit-original-interaction-response
export const editReply = async (
  interaction: APIInteraction,
  options: RESTPatchAPIWebhookWithTokenMessageJSONBody
): Promise<APIMessage> => {
  const path = Routes.webhookMessage(interaction.application_id, interaction.token, '@original')
  const response = await fetch(`${routes.discord}${path}`, {
    method: 'PATCH',
    body: JSON.stringify(options),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return await response.json()
}
