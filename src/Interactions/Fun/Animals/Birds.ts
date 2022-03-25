import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { request } from 'undici';

const birds: string[] = [];

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'bird'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        if (birds.length === 0) {
            await interaction.deferReply();

            const { body } = await request('https://shibe.online/api/birds?count=100&urls=true&httpsUrls=true');
            const j = await body.json() as string[];

            birds.push(...j);
        }

        return birds.shift()!;
    }
}