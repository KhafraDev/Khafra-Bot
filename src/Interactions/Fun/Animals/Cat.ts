import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { fetch } from 'undici';

interface RandomCat {
    file: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'cat'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        await interaction.deferReply();

        const r = await fetch('https://aws.random.cat/meow');
        const j = await r.json() as RandomCat;

        return j.file;
    }
}