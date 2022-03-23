import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { fetch } from 'undici';

interface BunniesIO {
    thisServed: number
    totalServed: number
    id: `${number}`,
    media: {
        gif: string
        poster: string
    }
    source: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'bunny'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        await interaction.deferReply();

        const r = await fetch('https://api.bunnies.io/v2/loop/random/?media=gif');
        const j = await r.json() as BunniesIO;

        return j.media.gif;
    }
}