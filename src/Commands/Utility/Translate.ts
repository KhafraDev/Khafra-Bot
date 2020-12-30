import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { langs, translate } from '../../lib/Backend/Translate.js';

export default class extends Command {
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

    async init(message: Message, args: string[]) {
        const to = langs.includes(args[0].toLowerCase()) ? args[0] : 'en';
        const from = langs.includes(args[1].toLowerCase()) ? args[1] : 'auto';

        if(args[0] === to) args.splice(0, 1);
        // removing one from array now makes this the first argument
        if(args[0] === from) args.splice(0, 1);
        if(args[1] === from) args.splice(1, 1);

        if(args.length === 0) {
            return message.reply(this.Embed.fail('Nothing to translate!'));
        }

        let tr;
        try {
            tr = await translate(args.join(' '), { to, from });
        } catch(e) {
            return message.reply(this.Embed.fail(e.message));
        }

        return message.reply(this.Embed.success(tr));
    }
}
