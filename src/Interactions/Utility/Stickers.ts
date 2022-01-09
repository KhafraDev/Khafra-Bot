import { client } from '#khaf/Client';
import { Interactions } from '#khaf/Interaction';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { once } from '#khaf/utility/Memoize.js';
import { inlineCode } from '@khaf/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageAttachment, Sticker } from 'discord.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const stickers: Sticker[] = [];
const mw = once(() => client.fetchPremiumStickerPacks());

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'sticker',
            description: 'Uses a default sticker!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'name',
                    description: 'The name of the sticker to use.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'offset',
                    description: 'Offset of the sticker name to use.',
                    min_value: 0
                }
            ]
        };

        super(sc, { ownerOnly: true });
    }

    async init(interaction: ChatInputCommandInteraction) {
        if (stickers.length === 0) {
            const res = await mw();
            if (res === null) {
                return `The stickers are already loading, please try again in a moment.`;
            }

            const allStickers = [...res.values()].flatMap(p => [...p.stickers.values()]);
            stickers.push(...allStickers);
        }

        const name = interaction.options.getString('name', true).toLowerCase();
        const stickerMatches: Sticker[] = [];

        for (const sk of stickers) {
            if (sk.name.toLowerCase() === name) {
                stickerMatches.push(sk);
            } else if (sk.tags?.includes(name)) {
                stickerMatches.push(sk);
            }
        }

        if (stickerMatches.length === 0) {
            return `❌ No stickers with that name were found.`;
        }

        const fileNames = new Set(stickerMatches.map(n => `${n.name};${n.id}.gif`));
        const offset = interaction.options.getInteger('offset') ?? 0;
        const fileName = [...fileNames][offset - 1] ?? [...fileNames][0];

        return {
            files: [
                new MessageAttachment(
                    await readFile(join(cwd, `assets/Stickers/${fileName}`)),
                    fileName
                ).setDescription(`A sticker for ${interaction.options.getString('name', true)}!`)
            ],
            content: `${inlineCode(interaction.options.getString('name', true))} (${fileNames.size} similar).`
        } as InteractionReplyOptions;
    }
} 