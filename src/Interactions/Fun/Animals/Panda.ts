import { InteractionSubCommand } from '#khaf/Interaction';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
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

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        await interaction.deferReply();

        const { body, statusCode } = await request('https://some-random-api.ml/img/panda');

        if (statusCode !== 200) {
            return {
                content: '🐼 Couldn\'t get a picture of a random panda!',
                ephemeral: true
            }
        }

        const j = await body.json() as SomeRandomPanda;

        return {
            content: j.link
        }
    }
}