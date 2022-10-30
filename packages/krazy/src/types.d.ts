import type {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'

/** wrangler secret put publicKey */
declare global {
  const publicKey: string
}

export interface InteractionCommand {
	data: RESTPostAPIApplicationCommandsJSONBody
  run (
    interaction: APIApplicationCommandInteraction,
    response: Request
  ): Promise<APIInteractionResponse>
}
