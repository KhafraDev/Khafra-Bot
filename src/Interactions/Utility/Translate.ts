import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { translate, langs } from '../../lib/Packages/Translate.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('translate')
            .addStringOption(option => option
                .setName('text')
                .setDescription('text to translate')
                .setRequired(true)    
            )
            .addStringOption(option => option
                .setName('to')
                .setDescription('language code to translate to (default: "en")')
                .setRequired(false)
            )
            .addStringOption(option => option
                .setName('from')
                .setDescription('language code to translate from (default: "from")')
                .setRequired(false)
            )
            .setDescription('Use Google Translate to translate some text!');

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const to = interaction.options.getString('to') ?? 'en';
        const from = interaction.options.getString('from') ?? 'auto';
        const text = interaction.options.getString('text', true);
        
        const translated = await translate(
            text,
            {
                to: langs.includes(to.toLowerCase()) ? to.toLowerCase() : 'en',
                from: langs.includes(from.toLowerCase()) ? from.toLowerCase() : 'auto'
            }
        );

        return Embed.success()
            .setDescription(translated)
            .setAuthor(interaction.user.username, interaction.user.displayAvatarURL());
    }
} 