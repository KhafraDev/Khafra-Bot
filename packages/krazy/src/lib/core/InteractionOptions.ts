import {
  type APIApplicationCommandInteraction,
  type APIApplicationCommandInteractionDataOption,
  ApplicationCommandOptionType
} from 'discord-api-types/v10'

export class InteractionOptions {
  #options: APIApplicationCommandInteractionDataOption[] = []

  constructor (data: APIApplicationCommandInteraction['data']) {
    if ('options' in data && Array.isArray(data.options)) {
      this.#options = data.options
    }
  }

  get <T extends APIApplicationCommandInteractionDataOption>(name: string, required: true): T
  get <T extends APIApplicationCommandInteractionDataOption>(name: string, required?: boolean): T | null
  get <T extends APIApplicationCommandInteractionDataOption>(
    name: string,
    required?: boolean
  ): T | null {
    for (const option of this.#options) {
      if (option.name === name) {
        return option as T
      }
    }

    if (required) {
      throw new TypeError(`Option "${name}" not found.`)
    }

    return null
  }

  #getValue <T extends string | number | boolean>(
    name: string,
    required: boolean | undefined,
    type: Exclude<
      ApplicationCommandOptionType,
      ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup
    >
  ): T | null {
    const option = this.get(name, required)

    if (!option) {
      return null
    }

    if (option.type !== type) {
      throw new TypeError(`Option "${name}" was not a string.`)
    }

    return option.value as T
  }

  getString (name: string, required: true): string
  getString (name: string, required?: boolean): string | null
  getString (name: string, required?: boolean): string | null {
    return this.#getValue(name, required, ApplicationCommandOptionType.String)
  }

  getInteger (name: string, required: true): number
  getInteger (name: string, required?: boolean): number | null
  getInteger (name: string, required?: boolean): number | null {
    return this.#getValue(name, required, ApplicationCommandOptionType.Integer)
  }
}
