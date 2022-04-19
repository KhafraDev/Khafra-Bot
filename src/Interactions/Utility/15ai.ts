import { Interactions } from '#khaf/Interaction';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import type { MessageActionRowComponentBuilder } from '@discordjs/builders';
import { ActionRowBuilder, hyperlink, inlineCode } from '@discordjs/builders';
import { FifteenDotAI } from '@khaf/15.ai';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { join } from 'node:path';

type Characters = typeof import('../../../packages/15.ai/Characters.json');

const characters = createFileWatcher({}, join(cwd, 'packages/15.ai/Characters.json')) as Characters;
const keys = (Object.keys(characters) as (keyof typeof characters)[])
    .map(k => characters[k]).flat(2);

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: '15ai',
            description: '15.ai: natural TTS.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'voice',
                    description: 'The character voice to use!',
                    required: true,
                    autocomplete: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'text',
                    description: 'Text to convert to speech.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const name = interaction.options.getString('voice', true).toLowerCase();
        const text = interaction.options.getString('text', true);
        const obj = keys.find(key => key.name.toLowerCase() === name);

        if (!obj) {
            return {
                content: '❌ No character with that name could be found! Use the autocomplete functionality!',
                ephemeral: true
            }
        } else if (text.length < 5) {
            return {
                content: '❌ Minimum of 5 characters required!',
                ephemeral: true
            }
        }

        const [err, voice] = await dontThrow(FifteenDotAI.getWav(
            obj.name,
            text,
            obj.emotions[0]
        ));

        if (err !== null) {
            return {
                content: `❌ An unexpected error occurred: ${inlineCode(err.message)}`,
                ephemeral: true
            }
        } else if (voice === null) {
            return {
                content: '❌ A server error occurred processing the TTS.',
                ephemeral: true
            }
        }

        let description = `${hyperlink('Visit 15.ai', 'https://15.ai')}\n`;
        const embed = EmbedUtil.setFooter(
            Embed.ok(),
            { text: '🗣️ tts provided by 15.ai' }
        );

        for (let i = 0; i < voice.wavNames.length; i++) {
            const url = `https://cdn.15.ai/audio/${voice.wavNames[i]}`;
            const confidence = `${(voice.scores[i] * 100).toFixed(2)}%`;
            description += `${url} [Confidence: ${confidence}]\n`;
        }

        EmbedUtil.setDescription(embed, description);

        return {
            embeds: [embed],
            components: [
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    Components.link('Visit 15.ai', 'https://15.ai')
                )
            ]
        }
    }
}