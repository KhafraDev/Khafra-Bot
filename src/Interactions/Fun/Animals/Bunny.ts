import { InteractionSubCommand } from '#khaf/Interaction';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { request } from 'undici';

interface BunniesIO {
    thisServed: number
    totalServed: number
    id: `${number}`
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

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        await interaction.deferReply();

        const { body, statusCode } = await request('https://api.bunnies.io/v2/loop/random/?media=gif');

        if (statusCode !== 200) {
            return {
                content: '🐰 Couldn\'t get a picture of a random bunny!',
                ephemeral: true
            }
        }

        const j = await body.json() as BunniesIO;

        return {
            content: j.media.gif
        }
    }
}