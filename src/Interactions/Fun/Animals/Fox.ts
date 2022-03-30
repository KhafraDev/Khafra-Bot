import { InteractionSubCommand } from '#khaf/Interaction';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
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

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        await interaction.deferReply();

        const { body } = await request('https://randomfox.ca/floof/');
        const j = await body.json() as RandomFoxCA;

        return {
            content: j.image
        }
    }
}