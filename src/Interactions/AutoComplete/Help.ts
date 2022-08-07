import { KhafraClient } from '#khaf/Bot'
import { InteractionAutocomplete } from '#khaf/Interaction'
import type { APIApplicationCommandOptionChoice, AutocompleteInteraction } from 'discord.js'

export class kAutocomplete extends InteractionAutocomplete {
    constructor () {
        super({
            name: 'command',
            references: 'help'
        })
    }

    async handle (interaction: AutocompleteInteraction): Promise<undefined> {
        const option = interaction.options.getFocused(true)

        if (option.name !== 'command') return

        const sortedKeys: APIApplicationCommandOptionChoice[] = []
        const value = option.value.toLowerCase()

        for (const command of KhafraClient.Interactions.Commands.values()) {
            const name = command.data.name

            if (name === value) {
                sortedKeys.unshift({ name, value: name })
            } else if (value.includes(name)) {
                sortedKeys.push({ name, value: name })
            }
        }

        await interaction.respond(sortedKeys)
    }
}