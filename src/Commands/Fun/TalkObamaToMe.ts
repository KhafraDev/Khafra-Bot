import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { talkObamaToMe } from '#khaf/utility/commands/TalkObamaToMe';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Have Obama say something to you.',
                'Khafra Bot is the best!'
            ],
            {
                name: 'talkobamatome',
                folder: 'Fun',
                aliases: ['totm'],
                args: [1]
            }
        );
    }

    async init (_message: Message, { args }: Arguments): Promise<string | APIEmbed> {
        const [barack, obama] = await dontThrow(talkObamaToMe(args.join(' ').slice(0, 280)));

        if (barack !== null) {
            return Embed.error(`An unexpected error occurred: ${inlineCode(barack.message)}`);
        }

        return obama;
    }
}