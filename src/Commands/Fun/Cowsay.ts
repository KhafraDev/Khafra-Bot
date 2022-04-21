import type { Arguments } from '#khaf/Command';
import { Command } from '#khaf/Command';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { assets } from '#khaf/utility/Constants/Path.js';
import { codeBlock } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';
import type { Message } from 'discord.js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = assets('Cowsay');
const start = `
 ________________________________________
`;
const types = new Set<string>();
const bases = new Map<string, string>();

export class kCommand extends Command {
    constructor () {
        super(
            [
                'The classic CowSay command for Discord!',
                'head-in Help, I\'m stuck!', 'tux Global warming is a hoax', 'just your ordinary cow.', 'list'
            ],
            {
                name: 'cowsay',
                folder: 'Fun',
                args: [1],
                ratelimit: 3
            }
        );
    }

    async init (_message: Message, { args }: Arguments): Promise<APIEmbed> {
        if (types.size === 0) { // lazy load types
            const items = await readdir(dir);
            const filtered = items
                .filter(t => t.endsWith('.txt'))
                .map(t => t.replace(/\.txt$/, ''));

            for (const item of filtered)
                types.add(item);
        }

        if (args[0].toLowerCase() === 'list') {
            return Embed.json({
                color: colors.ok,
                description: [...types].map(t => '``' + t + '``').join(', '),
                title: `${types.size} formats available`
            });
        }

        const [format, ...content] = types.has(args[0].toLowerCase())
            ? [args[0].toLowerCase(), ...args.slice(1)]
            : ['cowsay', ...args];

        if (content.length === 0)
            return Embed.error('Since you provided a format, you have to provide some text to say!');
        if (!types.has(format))
            return Embed.error('Format not found! Use the command `cowsay list` to list all formats!');

        const split = content.join(' ')
            .match(/.{1,38}/g)! // split every 38 characters; removes new lines
            .map((value, index, arr) => {
                if (index === 0) // first item in array
                    return `/ ${value.trim().padEnd(38, ' ')} \\`;
                if (index === arr.length - 1) // last item in array
                    return `\\ ${value.trim().padEnd(38, ' ')} /`;

                return `| ${value.trim().padEnd(38, ' ')} |`; // all others
            });

        if (split.length === 1) // 1-lined messages
            split.push(`\\ ${''.padEnd(38, ' ')} /`);

        if (!bases.has(format)) { // lazy load ascii arts
            const file = await readFile(join(dir, `${format}.txt`), 'utf-8');
            bases.set(format, file);
        }

        const art = bases.get(format)!;
        const formatted = codeBlock(`${start}${split.join('\n')}\n${art}`);

        if (formatted.length > 2048)
            return Embed.error('Message is too long, trim it down!');

        return Embed.ok(formatted);
    }
}