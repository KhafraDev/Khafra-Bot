import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { request } from 'undici';

interface SomeRandomPanda {
    link: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'redpanda'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        await interaction.deferReply();

        const { body } = await request('https://some-random-api.ml/img/red_panda');
        const j = await body.json() as SomeRandomPanda;

        return {
            content: j.link
        }
    }
}