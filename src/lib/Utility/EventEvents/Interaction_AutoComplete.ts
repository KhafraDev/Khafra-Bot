import { AutocompleteInteraction } from 'discord.js';
import { join } from 'path';
import { cwd } from '../Constants/Path.js';
import { dontThrow } from '../Don\'tThrow.js';
import { createFileWatcher } from '../FileWatcher.js';

type Characters = typeof import('../../Packages/15.ai/Characters.json');

const characters = createFileWatcher({}, join(cwd, 'src/lib/Packages/15.ai/Characters.json')) as Characters;
const keys = (Object.keys(characters) as (keyof typeof characters)[])
    .map(k => characters[k].map(char => char.name))
    .flat();

const sortKeys = (current: string) => {
    const sortedKeys: { name: string, value: string }[] = [];
    current = current.toLowerCase();

    for (const key of keys) {
        if (sortedKeys.length >= 25) break;

        const k = key.toLowerCase();
        if (k.startsWith(current)) {
            sortedKeys.unshift({ name: key, value: key });
        } else if (k.includes(current)) {
            sortedKeys.push({ name: key, value: key });
        }
    }

    if (sortedKeys.length === 0) {
        sortedKeys.push({ name: 'No options available', value: 'invalid' });
    }

    return sortedKeys;
}

// if more commands use autocomplete, this should be split into multiple files

export const autoCompleteHandler = async (interaction: AutocompleteInteraction) => {
    const option = interaction.options.getFocused(true);
    if (option.name === 'voice') {
        return void dontThrow(interaction.respond(sortKeys(option.value as string)));
    }
}