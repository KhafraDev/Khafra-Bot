import { Message } from "discord.js";
import { Command } from "../../Structures/Command.js";
import { thisWordDoesNotExist } from "../../lib/Backend/ThisWordDoesNotExist.js";

export default class extends Command {
    constructor() {
        super(
            [
                'This word does not exist!',
                ''
            ],
			{
                name: 'thisworddoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thisworddoesn\'texist', 'twdne' ]
            }
        );
    }

    async init(message: Message) {
        let word;
        try {
            word = await thisWordDoesNotExist();
        } catch(e) {
            console.log(e);
            return message.reply(this.Embed.fail('Received bad response from server!'));    
        }

        return message.reply(this.Embed.success(`
        **${word.word.word.toUpperCase()}** - ${word.word.pos}
        *${word.word.syllables.join(' − ')}*
        \`\`${word.word.definition}\`\`
        ${word.word.example ? `*__${word.word.example}__*` : ''}

        [View Online](${word.permalink_url}).
        `));
    }
}