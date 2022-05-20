import { InteractionSubCommand } from '#khaf/Interaction';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { request } from 'undici';

const birds: string[] = [];

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'bird'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        if (birds.length === 0) {
            await interaction.deferReply();

            const { body, statusCode } = await request('https://shibe.online/api/birds?count=100&urls=true&httpsUrls=true');

            if (statusCode !== 200) {
                return {
                    content: '🐦 Couldn\'t get a picture of a random bird!',
                    ephemeral: true
                }
            }

            const j = await body.json() as string[];

            birds.push(...j);
        }

        return {
            content: birds.shift()
        }
    }
}