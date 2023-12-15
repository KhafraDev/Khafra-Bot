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

  constructor (
    public data: InteractionData,
    public options: InteractionOptions = {}
  ) {}

  init (interaction: ChatInputCommandInteraction): Promise<HandlerReturn> | HandlerReturn {
    const subcommand = interaction.options.getSubcommandGroup(false)
      ?? interaction.options.getSubcommand()
    const subcommandName = `${this.data.name}-${subcommand}`

    if (!KhafraClient.Interactions.Subcommands.has(subcommandName)) {
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

    const option = KhafraClient.Interactions.Subcommands.get(subcommandName)!

    return option.handle(interaction)
  }

  public set id (body: APIApplicationCommand['id']) {
    this.#id = body
  }

  public get id (): string {
    return this.#id!
  }
}

export abstract class InteractionSubCommand {
  public constructor (public data: SubcommandOptions) {}

  public get references (): Interactions {
    return KhafraClient.Interactions.Commands.get(this.data.references)!
  }

  abstract handle (arg: ChatInputCommandInteraction): Promise<HandlerReturn> | HandlerReturn
}

export abstract class InteractionAutocomplete {
  public constructor (public data: SubcommandOptions) {}

  abstract handle (arg: AutocompleteInteraction): Promise<void> | void
}

/**
 * @link {https://discord.com/developers/docs/interactions/application-commands#user-commands}
 */
export abstract class InteractionUserCommand {
  constructor (
    public data: InteractionData,
    public options: InteractionOptions = {}
  ) {}

  abstract init (
    interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction
  ): Promise<HandlerReturn>
}
