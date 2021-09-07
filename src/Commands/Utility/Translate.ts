import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { translate } from '../../lib/Packages/Translate.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Translate something to and from different languages using Google Translate!',
                '[to?="en"] [from?="auto detect"] [text to translate]'
            ],
			{
                name: 'translate',
                folder: 'Utility',
                args: [2],
                aliases: [ 'tr' ]
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        const tr = await translate(args.join(' '), { to: 'de', from: 'en' });
        
        return this.Embed.success(tr);
    }
}
