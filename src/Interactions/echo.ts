import { ApplicationCommandOption, CommandInteraction } from 'discord.js';
import { RegisterInteraction } from '../Structures/Decorator.js';
import { Interactions } from '../Structures/Interaction.js';

@RegisterInteraction
export class kInteraction extends Interactions {
    data: ApplicationCommandOption = {
        type: 'STRING',
        name: 'echo',
        description: 'Replies with your input!',
        options: [{
            name: 'input',
            type: 'STRING',
            description: 'The input that\'s echoed back!',
            required: true
        }]
    };

    init(interaction: CommandInteraction) {
        const input = interaction.options[0].value! as string;
        return interaction.reply(input);
    }
}