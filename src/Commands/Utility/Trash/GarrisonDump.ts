/** Please get mental illness treated! */

import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { Message, MessageAttachment } from 'discord.js';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface Comic {
    comic_key: number
    href: string
    link: string
    title: string
}

const PATH = join(process.cwd(), 'assets/Garrison.json');
let cachedAttachment: MessageAttachment | null = null;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Dump a list of all comics in the database.'
            ],
            {
                name: 'bengarrisondump',
                folder: 'Trash',
                args: [0, 0],
                aliases: [ 'garrisondump' ]
            }
        );
    }

    async init(message: Message) {
        if (!this.isBotOwner(message.author.id) || cachedAttachment) {
            if (cachedAttachment)
                return cachedAttachment.url;

            const json = JSON.parse(await readFile(PATH, 'utf-8')) as Comic[];
            const buff = Buffer.from(JSON.stringify(json));
            const attachment = new MessageAttachment(buff, 'Garrison.json');

            const m = await message.reply(attachment);
            cachedAttachment = m.attachments.first();
            return;
        }

        const { rows } = await pool.query<Comic>(`
            SELECT * FROM kbGarrison;
        `);

        const buff = Buffer.from(JSON.stringify(rows));
        const attachment = new MessageAttachment(buff, 'Garrison.json');

        await writeFile(PATH, buff, 'utf-8');
        const m = await message.reply(attachment);
        cachedAttachment = m.attachments.first();
    }
}