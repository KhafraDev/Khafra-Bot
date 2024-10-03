import { KhafraClient } from '#khaf/Bot'
import type { APIApplicationCommand, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction
} from 'discord.js'

interface InteractionOptions {
  defer?: boolean
  ownerOnly?: boolean
  /**
   * If the command should not be deployed automatically.
   */
  deploy?: boolean
}

interface SubcommandOptions {
  references: string
  name: string
}

type HandlerReturn =
  | import('discord.js').InteractionReplyOptions
  | null
  | void

type InteractionData = RESTPostAPIApplicationCommandsJSONBody

export class Interactions {
  #id: APIApplicationCommand['id'] | undefined

  data: InteractionData
  options: InteractionOptions

  constructor (
    data: InteractionData,
    options: InteractionOptions = {}
  ) {
    this.data = data
    this.options = options
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<HandlerReturn> {
    const subcommand = interaction.options.getSubcommandGroup(false)
      ?? interaction.options.getSubcommand()
    const subcommandName = `${this.data.name}-${subcommand}`
    const option = KhafraClient.Interactions.Subcommands.get(subcommandName)

    if (!option) {
      return {
        content: '❌ This option has not been implemented yet!'
      }
    } else if (this.data.default_member_permissions) {
      const defaultPerms = BigInt(this.data.default_member_permissions)

      if (!interaction.memberPermissions?.has(defaultPerms)) {
        return {
          content: '❌ You do not have permission to use this command!'
        }
      }
    }

    try {
      return await option.handle(interaction)
    } finally {
      // option.onEnd()
    }
  }

  set id (body: APIApplicationCommand['id']) {
    this.#id = body
  }

  get id (): string {
    return this.#id!
  }
}

interface Dispatcher<Data, Args extends unknown[], Return extends Promise<unknown>> {
  data: Data
  handle: (...args: Args) => Return
}

export type InteractionSubCommand = Dispatcher<
  SubcommandOptions,
  [input: ChatInputCommandInteraction],
  Promise<HandlerReturn>
>

export type InteractionAutocomplete = Dispatcher<
  SubcommandOptions,
  [input: AutocompleteInteraction],
  Promise<void>
>

/**
 * @link {https://discord.com/developers/docs/interactions/application-commands#user-commands}
 */
export interface InteractionUserCommand<
  I extends UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction =
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction
> extends
  Dispatcher<
    InteractionData,
    [input: I],
    Promise<HandlerReturn>
  >
{
  options?: InteractionOptions
}
