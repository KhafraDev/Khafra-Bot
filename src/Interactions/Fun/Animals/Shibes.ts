import { InteractionSubCommand } from '#khaf/Interaction';
import { ChatInputCommandInteraction } from 'discord.js';
import { request } from 'undici';

const shibes: string[] = [];

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'shibe'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        if (shibes.length === 0) {
            await interaction.deferReply();

            const { body } = await request('https://shibe.online/api/shibes?count=100&urls=true&httpsUrls=true');
            const j = await body.json() as string[];

            shibes.push(...j);
        }

        return shibes.shift()!;
    }
}