import { CommandInteraction, InteractionReplyOptions, MessageAttachment, Sticker } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import { client } from '../../index.js';
import { once } from '../../lib/Utility/Memoize.js';
import { readFile } from 'fs/promises';
import { join } from 'path/posix';
import { cwd } from '../../lib/Utility/Constants/Path.js';

const stickers: Sticker[] = [];
const mw = once(() => client.fetchPremiumStickerPacks());

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('sticker')
            .addStringOption(option => option
                .setName('name')
                .setDescription('the name of the sticker you want to use')
                .setRequired(true)    
            )
            .addIntegerOption(option => option
                .setName('offset')
                .setDescription('there may be more than 1 sticker with that name, this chooses which one should be displayed')
                .setRequired(false)
            )
            .setDescription('Use a sticker!');

        super(sc, { ownerOnly: true });
    }

    async init(interaction: CommandInteraction) {
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
        const offset = interaction.options.getInteger('offset')
            ? interaction.options.getInteger('offset', true)
            : 0;
        const fileName = [...fileNames][offset - 1] ?? [...fileNames][0];

        return {
            files: [
                new MessageAttachment(
                    await readFile(join(cwd, `assets/Stickers/${fileName}`)),
                    fileName
                )
            ],
            content: `${inlineCode(interaction.options.getString('name', true))} (${fileNames.size} similar).`
        } as InteractionReplyOptions;
    }
} 