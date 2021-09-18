import { AllowedImageFormat, AllowedImageSize, CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

const sizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const formats = ['webp', 'png', 'jpg', 'jpeg'];

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('avatar')
            .addUserOption(option => option
                .setName('user')
                .setDescription('User to get avatar of.')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('size')
                .addChoices(sizes.map(s => [`${s}`, `${s}`]))
                .setDescription('Set the size of the avatar to get.')
                .setRequired(false)
            )
            .addStringOption(option => option
                .setName('format')
                .addChoices(formats.map(f => [f, f]))
                .setDescription('Image format')
                .setRequired(false)
            )
            .setDescription('Get a user\'s avatar!');

        super(sc);
    }

    async init(interaction: CommandInteraction) {
        const user = interaction.options.getUser('user', true);
        const size = interaction.options.getString('size') ?? '256';
        const format = interaction.options.getString('format') ?? 'webp'

        const avatar = user.displayAvatarURL({
            size: Number(size) as AllowedImageSize,
            format: format as AllowedImageFormat
        });

        return Embed.success().setImage(avatar);
    }
} 