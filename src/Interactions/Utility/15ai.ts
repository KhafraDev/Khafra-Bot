import { Interactions } from '../../Structures/Interaction.js';
import { hyperlink, inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { createFileWatcher } from '../../lib/Utility/FileWatcher.js';
import { join } from 'path';
import { cwd } from '../../lib/Utility/Constants/Path.js';
import { FifteenDotAI } from '../../lib/Packages/15.ai/index.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

type Characters = typeof import('../../lib/Packages/15.ai/Characters.json');

const characters = createFileWatcher({}, join(cwd, 'src/lib/Packages/15.ai/Characters.json')) as Characters;
const keys = Object.keys(characters) as (keyof typeof characters)[];

const factory = () => {
    const sc = new SlashCommandBuilder()
        .setName('15ai')
        .setDescription('15.ai: natural TTS.')

    for (const key of keys.slice(0, 25)) {
        const choices: [string, string][] = [];

        for (const choice of characters[key].slice(0, 25)) {
            choices.push([choice.name, choice.name]);
        }

        const name = key.toLowerCase();

        sc.addSubcommand(command => command
            .setName(name)
            .addStringOption(option => option
                .setName('voice')
                .setDescription('Voice to choose TTS from.')
                .setRequired(true)
                .addChoices(choices)
            )
            .addStringOption(option => option
                .setName('text')
                .setDescription('text to convert to speech.')
                .setRequired(true)    
            )
            .setDescription(`${key} voice`)
        );
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
            const confidence = `${voice.scores[i].toFixed(2)}%`;
            embed.description += `${hyperlink(`Option ${i + 1}`, url)} [Confidence: ${confidence}]\n`;
        }

        return embed;
    }
} 