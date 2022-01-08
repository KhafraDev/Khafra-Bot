import { InteractionAutocomplete } from '#khaf/Interaction';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { ApplicationCommandOptionChoice, AutocompleteInteraction } from 'discord.js';
import { join } from 'path';

type Characters = typeof import('../../../packages/15.ai/Characters.json');

const characters = createFileWatcher(
    {} as Characters,
    join(cwd, 'packages/15.ai/Characters.json')
);

const keys = (Object.keys(characters) as (keyof typeof characters)[])
    .map(k => characters[k].map(char => char.name))
    .flat();

export class kAutocomplete extends InteractionAutocomplete {
    constructor () {
        super({
            name: 'voice',
            references: '15ai'
        });
    }

    async handle (interaction: AutocompleteInteraction) {
        const option = interaction.options.getFocused(true);

        if (option.name !== 'voice') return;

        const sortedKeys: ApplicationCommandOptionChoice[] = [];
        const value = `${option.value}`.toLowerCase();

        for (const key of keys) {
            if (sortedKeys.length >= 25) break;

            const k = key.toLowerCase();
            if (k.startsWith(value)) {
                sortedKeys.unshift({ name: key, value: key });
            } else if (k.includes(value)) {
                sortedKeys.push({ name: key, value: key });
            }
        }

        if (sortedKeys.length === 0) {
            sortedKeys.push({ name: 'No options available', value: 'invalid' });
        }

        return void dontThrow(interaction.respond(sortedKeys));
    }
}