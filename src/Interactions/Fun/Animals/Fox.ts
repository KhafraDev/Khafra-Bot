import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { request } from 'undici';

interface RandomFoxCA {
    image: string
    link: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'fox'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        await interaction.deferReply();

        const { body } = await request('https://randomfox.ca/floof/');
        const j = await body.json() as RandomFoxCA;

        return j.image;
    }
}