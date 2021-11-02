import { hyperlink, inlineCode } from '@discordjs/builders';
import { FifteenDotAI } from '@khaf/15.ai';
import { APIApplicationCommandOption, ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction } from 'discord.js';
import { join } from 'path';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { cwd } from '../../lib/Utility/Constants/Path.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { createFileWatcher } from '../../lib/Utility/FileWatcher.js';
import { Interactions } from '../../Structures/Interaction.js';

type Characters = typeof import('../../lib/Packages/15.ai/Characters.json');

const characters = createFileWatcher({}, join(cwd, 'src/lib/Packages/15.ai/Characters.json')) as Characters;
const keys = (Object.keys(characters) as (keyof typeof characters)[])
    .map(k => characters[k].flat()).flat();

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: '15ai',
            description: '15.ai: natural TTS.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'voice',
                    description: 'Voice to choose TTS from.',
                    required: true,
                    autocomplete: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'text',
                    description: 'Text to convert to speech.',
                    required: true
                }
            ] as APIApplicationCommandOption[] // TODO(@KhafraDev): remove once autocomplete option is supported
        };
        
        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const name = interaction.options.getString('voice', true).toLowerCase();
        const text = interaction.options.getString('text', true);
        const obj = keys.find(key => key.name.toLowerCase() === name);

        if (!obj) {
            return `❌ No character with that name could be found! Use the autocomplete functionality!`;
        } else if (text.length < 5) {
            return `❌ Minimum of 5 characters required!`;
        }

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