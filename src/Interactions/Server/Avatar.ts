import { ChatInputCommandInteraction } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ImageExtension, ImageSize } from '@discordjs/rest';
import { type Embed as MessageEmbed } from '@khaf/builders';

const sizes: ImageSize[] = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const formats: ImageExtension[] = ['webp', 'png', 'jpg', 'jpeg', 'gif'];

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'avatar',
            description: 'Get someone\'s avatar!',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'user',
                    description: 'User to get the avatar of.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'size',
                    description: 'Set the size of the avatar image.',
                    choices: sizes.map(s => ({ name: `${s}`, value: `${s}` }))
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'format',
                    description: 'Set the image type of the avatar.',
                    choices: formats.map(f => ({ name: f, value: f }))
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<MessageEmbed> {
        const user = interaction.options.getUser('user', true);
        const size = interaction.options.getString('size') ?? '256';
        const format = interaction.options.getString('format') ?? 'webp'

        const avatar = user.displayAvatarURL({
            size: Number(size) as ImageSize,
            extension: format as ImageExtension
        });

        return Embed.ok().setImage(avatar);
    }
} 