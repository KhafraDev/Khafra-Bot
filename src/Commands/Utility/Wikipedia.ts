import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { Wikipedia } from "../../lib/Backend/Wikipedia/Wikipedia";
import { AllHtmlEntities } from "html-entities";

const all = new AllHtmlEntities();

export default class extends Command {
    constructor() {
        super(
            [
                'Search Wikipedia for an article!',
                'Jupiter', 'Green Day'
            ],
            [ /* No extra perms needed */ ], {
                name: 'wikipedia',
                folder: 'Utility',
                cooldown: 10,
                aliases: [ 'wiki' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const wiki = await Wikipedia(args.join(' '));
        if('error' in wiki) {
            return message.channel.send(Embed.fail(`
            Received status ${wiki.httpCode} (${wiki.httpReason}).
            `));
        } else if(wiki.pages.length === 0) {
            return message.channel.send(Embed.fail(`No results found!`));
        }

        const embed = Embed.success(all.decode(wiki.pages[0].excerpt.replace(/<[^>]*>?/gm, '').slice(0, 2048)))
            .setTitle(wiki.pages[0].title)
            .setThumbnail(wiki.pages[0].thumbnail?.url ? 'https:' + wiki.pages[0].thumbnail?.url : null);

        return message.channel.send(embed);
    }
}