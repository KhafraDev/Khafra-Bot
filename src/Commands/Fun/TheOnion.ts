import { Command } from '../../Structures/Command.js';
import TheOnion from '../../../assets/TheOnion.json';
import { decodeXML } from 'entities';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { fetch } from '../../Structures/Fetcher.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'Read an article from TheOnion!',
                ''
            ],
			{
                name: 'theonion',
                folder: 'Fun',
                aliases: [ 'onion', 'realnews' ],
                args: [0, 0]
            }
        );
    }

    async init() {
        const id = TheOnion[Math.floor(Math.random() * TheOnion.length)];

        const j = await fetch(`https://theonion.com/api/core/corepost/getList?id=${id}`).json();

        if (j.data.length === 0)
            return this.Embed.fail(`
            You'll have to read the article on TheOnion this time, sorry!
            https://www.theonion.com/${id}
            `);

        return this.Embed.success()
            .setAuthor(decodeXML(j.data[0].headline).slice(0, 256), undefined, j.data[0].permalink)
            .setTimestamp(j.data[0].publishTimeMillis)
            .setDescription(j.data[0].plaintext.slice(0, 2048));
    }
}