import { Interactions } from '../../Structures/Interaction.js';
import { hyperlink, inlineCode } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { createFileWatcher } from '../../lib/Utility/FileWatcher.js';
import { join } from 'path';
import { cwd } from '../../lib/Utility/Constants/Path.js';
import { FifteenDotAI } from '@khaf/15.ai';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

type Characters = typeof import('../../lib/Packages/15.ai/Characters.json');

const characters = createFileWatcher({}, join(cwd, 'src/lib/Packages/15.ai/Characters.json')) as Characters;
const keys = Object.keys(characters) as (keyof typeof characters)[];

const factory = () => {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
        name: '15ai',
        description: '15.ai: natural TTS.',
        options: []
    };

    for (const key of keys.slice(0, 25)) {
        const choices: { name: string, value: string }[] = [];

        for (const choice of characters[key].slice(0, 25)) {
            choices.push({ name: choice.name, value: choice.name });
        }

        const name = key.toLowerCase();
        sc.options!.push({
            type: ApplicationCommandOptionType.Subcommand,
            name: name,
            description: `${key}'s voice.`,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'voice',
                    description: 'Voice to choose TTS from.',
                    required: true,
                    choices: choices
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'text',
                    description: 'Text to convert to speech.',
                    required: true
                }
            ]
        });
    }

    return sc;
}

export class kInteraction extends Interactions {
    constructor() {
        super(factory(), { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand(true);
        const name = interaction.options.getString('voice', true);
        const text = interaction.options.getString('text', true);

        if (text.length < 5) {
            return `❌ Minimum of 5 characters required!`;
        }

        const key = keys.find(k => k.toLowerCase() === subcommand)!;
        const obj = characters[key].find(n => n.name === name)!;

        const [err, voice] = await dontThrow(FifteenDotAI.getWav(
            obj.name,
            text,
            obj.emotions[0]
        ));

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        } else if (voice === null) {
            return `❌ A server error occurred processing the TTS.`;
        }

        const embed = Embed.success()
            .setDescription(`${hyperlink('Visit 15.ai', `https://15.ai`)}\n`)
            .setFooter(`🗣️ tts provided by 15.ai`);

        for (let i = 0; i < voice.wavNames.length; i++) {
            const url = `https://cdn.15.ai/audio/${voice.wavNames[i]}`;
            const confidence = `${(voice.scores[i] * 100).toFixed(2)}%`;
            embed.description += `${url} [Confidence: ${confidence}]\n`;
        }

        return embed;
    }
} 