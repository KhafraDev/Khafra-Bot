import { hyperlink, inlineCode } from '@khaf/builders';
import { FifteenDotAI } from '@khaf/15.ai';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ChatInputCommandInteraction } from 'discord.js';
import { join } from 'path';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { Interactions } from '#khaf/Interaction';

type Characters = typeof import('../../../packages/15.ai/Characters.json');

const characters = createFileWatcher({}, join(cwd, 'packages/15.ai/Characters.json')) as Characters;
const keys = (Object.keys(characters) as (keyof typeof characters)[])
    .map(k => characters[k]).flat(2);

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: '15ai',
            description: '15.ai: natural TTS.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'voice',
                    description: 'The character voice to use!',
                    required: true,
                    autocomplete: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'text',
                    description: 'Text to convert to speech.',
                    required: true
                }
            ]
        };
        
        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction) {
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

        const embed = Embed.ok()
            .setDescription(`${hyperlink('Visit 15.ai', `https://15.ai`)}\n`)
            .setFooter({ text: `🗣️ tts provided by 15.ai` });

        for (let i = 0; i < voice.wavNames.length; i++) {
            const url = `https://cdn.15.ai/audio/${voice.wavNames[i]}`;
            const confidence = `${(voice.scores[i] * 100).toFixed(2)}%`;
            embed.description += `${url} [Confidence: ${confidence}]\n`;
        }

        return embed;
    }
} 