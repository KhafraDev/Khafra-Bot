import type { APIApplicationCommandInteraction, APIApplicationCommandInteractionDataBasicOption } from 'discord-api-types/v10'

export const getOption = <T extends string | number | boolean>(
  data: APIApplicationCommandInteraction['data'],
  name: string
): APIApplicationCommandInteractionDataBasicOption & { value: T } | null => {
  if (!('options' in data) || !data.options) {
    return null
  }

  return data.options.find(
    (option) => option.name === name
  ) as APIApplicationCommandInteractionDataBasicOption & { value: T } | null ?? null
}

export const time = (unix: Date, format: string): string =>
  `<t:${Math.floor(unix.getTime() / 1000)}:${format}>`
