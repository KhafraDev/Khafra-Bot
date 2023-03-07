import type {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
  RESTPostAPIApplicationCommandsJSONBody,
  APIInteraction
} from 'discord-api-types/v10'
import type { InteractionOptions } from './lib/core/InteractionOptions.mjs'

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
    options: Options
  ): Promise<APIInteractionResponse>
}

export interface InteractionHandler<T extends APIInteraction> {
  run (interaction: T): Promise<APIInteractionResponse | void>
}
