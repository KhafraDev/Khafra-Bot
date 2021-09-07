import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { owlbotio } from '../../lib/Packages/OwlBotIO.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('dictionary')
            .addStringOption(option => option
                .setName('word')
                .setDescription('The word (or phrase) to define.')
                .setRequired(true)    
            )
            .setDescription('Define a word or short phrase!');

        super(sc);
    }

    async init(interaction: CommandInteraction) {
        const phrase = interaction.options.getString('word', true);
        const word = await owlbotio(phrase);

        if (word.definitions === undefined) {
            return '❌ No definition found!';
        }

        return `
        **${word.word}** ${word.pronunciation ? `(${word.pronunciation})` : ''}
        ${word.definitions
            .map(w => `*${w.type}* - ${w.definition}${w.emoji ? ` ${w.emoji}` : ''}`)
            .join('\n')
            .slice(0, 2048 - word.word.length - (word.pronunciation ? word.pronunciation.length + 2 : 0))
        }
        `.trim();
    }
} 