import { InteractionSubCommand } from '#khaf/Interaction';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { request } from 'undici';

interface NekosLifeLizard {
    url: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'lizard'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        await interaction.deferReply();

        const { body } = await request('https://nekos.life/api/v2/img/lizard');
        const j = await body.json() as NekosLifeLizard;

        return {
            content: j.url
        }
    }
}