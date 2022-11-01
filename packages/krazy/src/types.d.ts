import type {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { InteractionOptions } from './lib/core/InteractionOptions.js'

/** wrangler secret put publicKey */
declare global {
  const publicKey: string
}

interface Options {
  options: InteractionOptions
}

export interface InteractionCommand {
	data: RESTPostAPIApplicationCommandsJSONBody
  run (
    interaction: APIApplicationCommandInteraction,
    response: Request,
    options: Options
  ): Promise<APIInteractionResponse> | APIInteractionResponse
}
