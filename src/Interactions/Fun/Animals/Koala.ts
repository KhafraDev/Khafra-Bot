import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { fetch } from 'undici';

interface SomeRandomPanda {
    link: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'koala'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        await interaction.deferReply();

        const r = await fetch('https://some-random-api.ml/img/koala');
        const j = await r.json() as SomeRandomPanda;

        return j.link;
    }
}