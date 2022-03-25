import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { request } from 'undici';

interface RandomDUK {
    message: string
    url: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'duck'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        await interaction.deferReply();

        const { body } = await request('https://random-d.uk/api/v1/random');
        const j = await body.json() as RandomDUK;

        return j.url;
    }
}