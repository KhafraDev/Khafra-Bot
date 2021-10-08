import { CommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import { fetch } from 'undici';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('qr')
            .addStringOption(option => option
                .setName('input')
                .setDescription('text to get a QR code for')
                .setRequired(true)
            )
            .setDescription('Get the QR code for some text.');

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const text = interaction.options.getString('input', true);
        const [e, r] = await dontThrow(fetch(`https://qrcode.show/${text}`, {
            headers: {
                Accept: 'image/png'
            }
        }));

        if (e !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(e.message)}.`;
        }

        const attachment = new MessageAttachment(await r.blob(), 'qr.png');

        return {
            files: [attachment]
        } as InteractionReplyOptions;
    }
} 