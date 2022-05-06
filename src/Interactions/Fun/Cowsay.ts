import { Interactions } from '#khaf/Interaction';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { assets } from '#khaf/utility/Constants/Path.js';
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { codeBlock, type ChatInputCommandInteraction, type InteractionReplyOptions } from 'discord.js';
import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

const cache = new Map<string, string>();
const maxLength = 38;

const splitEvery = (text: string): string[] => {
    const split: string[] = [];

    while (text.length) {
        const sliced = text.slice(0, 38);
        split.push(sliced);
        text = text.slice(38);
    }

    return split;
}

const calculateMaxLineLength = (lines: string[]): string[] => {
    const f: string[] = [];

    for (const word of lines) {
        const last = f.at(-1) ?? '';

        if (last.length >= maxLength || last.length + word.length > maxLength) {
            if (word.length > maxLength) {
                f.push(...splitEvery(word));
            } else {
                f.push(word);
            }
        } else {
            f[Math.max(f.length - 1, 0)] = (last + ' ' + word).trim();
        }
    }

    return f;
}

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'cowsay',
            description: 'The cowsay CLI (https://en.wikipedia.org/wiki/Cowsay) in Discord',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'message',
                    description: 'The message to say.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'format',
                    description: 'The cowfile to use.',
                    choices: readdirSync((assets('Cowsay')))
                        .filter((_, i) => i % 2 === 0) // include cowsay.txt & tux.txt, thanks Discord
                        .slice(0, 25) // Thanks Discord. I'm sure 25 choices is enough!!!
                        .map((name) => ({ name: basename(name, extname(name)), value: name }))
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const message = interaction.options.getString('message', true);
        const format = interaction.options.getString('format') ?? 'cowsay.txt';

        if (!cache.has(format)) {
            cache.set(format, await readFile(assets('Cowsay', format), 'utf-8'));
        }

        const cow = cache.get(format)!; // what is this, rust?
        const lines = calculateMaxLineLength(message.split(/\s+/g));
        const max = lines.reduce((a, b) => b.length > a ? b.length : a, 0);

        const header = ` ${'_'.repeat(max + 2)}\n`;
        const footer = ` ${'-'.repeat(max + 2)}\n`;
        let output = header;

        for (const line of lines) {
            const idx = lines.indexOf(line);
            const l = line.padEnd(max, ' ');

            if (idx === 0) {
                output += `/ ${l} \\\n`;
            } else if (idx === lines.length - 1) {
                output += `\\ ${l} /\n`;
            } else {
                output += `| ${l} |\n`;
            }
        }

        if (lines.length === 1) {
            output += `\\${' '.repeat(max + 2)}/\n`;
        }

        return {
            embeds: [
                Embed.json({
                    color: colors.ok,
                    description: codeBlock(output + footer + cow)
                })
            ]
        }
    }
}