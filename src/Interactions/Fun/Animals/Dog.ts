import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { fetch } from 'undici';

interface DogCEO {
    message: string
    status: string // "success" | "error"?
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'dog'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        await interaction.deferReply();

        const r = await fetch('https://dog.ceo/api/breeds/image/random');
        const j = await r.json() as DogCEO;

        return j.message;
    }
}