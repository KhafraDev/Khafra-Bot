import type { InteractionOptions } from '#/core/InteractionOptions.mjs'
import type {
  APIApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponse,
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'

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
