import { Interactions } from '../../Structures/Interaction.js';
import { bold, hyperlink, inlineCode, italic, SlashCommandBuilder, underscore } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { thisDoesNotExist, DNE } from '../../lib/Packages/ThisDoesNotExist.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { thisWordDoesNotExist } from '../../lib/Packages/ThisWordDoesNotExist.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { thisSimpsonDoesNotExist } from '../../lib/Packages/Simpson.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('thisdoesnotexist')
            .addStringOption(option => option
                .setName('type')
                .setDescription('Type of image to get.')
                .setRequired(true)
                .addChoice('artwork', 'tdne_artwork')
                .addChoice('cat', 'tdne_cat')
                .addChoice('fucked up homer', 'tdne_fuhomer')
                .addChoice('horse', 'tdne_horse')
                .addChoice('person', 'tdne_person')
                .addChoice('word', 'tdne_word')
            )
            .setDescription(`Get an AI generated picture of a person or item that doesn't exist!`);
        
        super(sc);
    }

    async init(interaction: CommandInteraction) {
        const type = interaction.options.getString('type', true);
        if (type === 'tdne_fuhomer') {
            const [err, homer] = await dontThrow(thisSimpsonDoesNotExist());

            if (err !== null) {
                return `❌ An unexpected error occurred getting a Homer!`;
            }

            return Embed.success().setImage(homer);
        } else if (type === 'tdne_word') {
            const [err, word] = await dontThrow(thisWordDoesNotExist());

            if (err !== null || word === null) {
                return `❌ An unexpected error occurred getting a word!`;
            }

            return Embed.success(`
            ${bold(word.word.word.toUpperCase())} - ${word.word.pos}
            ${italic(word.word.syllables.join(' − '))}
            ${inlineCode(word.word.definition)}
            ${word.word.example ? `${italic(underscore(word.word.example))}` : ''}

            ${hyperlink('View Online', word.permalink_url)}
            `);
        } else {
            const [err, image] = await dontThrow(thisDoesNotExist(type.split('_')[1] as DNE));

            if (err !== null || image === null) {
                return `❌ Not yet implemented or an error occurred!`;
            }

            return image;
        }
    }
} 