import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v10'
import type { AutocompleteInteraction } from 'discord.js'
import { request } from 'undici'
import { InteractionAutocomplete } from '#khaf/Interaction'

interface MinecraftItem {
  id: number
  name: string
  displayName: string
  stackSize: number
}

const items = 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.19/items.json'
let json: MinecraftItem[] | undefined

export class kAutocomplete extends InteractionAutocomplete {
  constructor() {
    super({
      name: 'item',
      references: 'minecraft'
    })
  }

  async handle(interaction: AutocompleteInteraction): Promise<undefined> {
    json ??= (await (await request(items)).body.json()) as MinecraftItem[]

    const option = interaction.options.getFocused(true)

    if (option.name !== 'item') return

    const sortedKeys: APIApplicationCommandOptionChoice[] = []
    const value = `${option.value}`.toLowerCase()

    if (value.length !== 0) {
      for (const item of json) {
        if (sortedKeys.length >= 25) break

        const displayName = item.displayName.toLowerCase()

        if (displayName === value) {
          sortedKeys.unshift({ name: item.displayName, value: item.displayName })
        } else if (displayName.includes(value)) {
          sortedKeys.push({ name: item.displayName, value: item.displayName })
        }
      }
    }

    if (sortedKeys.length === 0) {
      sortedKeys.push({ name: 'No items found', value: 'invalid' })
    }

    await interaction.respond(sortedKeys)
  }
}
