import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { request } from 'undici';

interface SomeRandomPanda {
    link: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'panda'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        await interaction.deferReply();

        const { body } = await request('https://some-random-api.ml/img/panda');
        const j = await body.json() as SomeRandomPanda;

        return j.link;
    }
}