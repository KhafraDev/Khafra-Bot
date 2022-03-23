import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { fetch } from 'undici';

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

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        await interaction.deferReply();

        const r = await fetch('https://nekos.life/api/v2/img/lizard');
        const j = await r.json() as NekosLifeLizard;

        return j.url;
    }
}