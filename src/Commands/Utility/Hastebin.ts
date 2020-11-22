import { Command } from "../../Structures/Command.js";
import { hasteServers, Paste } from "../../lib/Backend/Hastebin/Hastebin.js";
import { Message } from "discord.js";
import { GuildSettings } from "../../lib/types/Collections.js";
import { createRequire } from 'module';

const { prefix: defPrefix } = createRequire(import.meta.url)('../../../config.json');

export default class extends Command {
    constructor() {
        super(
            [
                'Upload a paste to Hastebin, Hatebin, or Nomsy!',
                'hatebin const bot = KhafraClient;',
                'Nomsy who knew Heroku CDN was trash? Not hastebin.',
                'hastebin Hello, world!'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'hastebin',
                folder: 'Utility',
                args: [1],
                aliases: hasteServers.map(s => s.alias).flat()
            }
        );
    }

    async init(message: Message, _: string[], settings: GuildSettings) {
        // args replaces all whitespace characters, including new lines.
        // to prevent this, we re-format the message's content.
        const prefix: string = settings?.prefix ?? defPrefix;
        // this is always valid because it uses the command's name
        const command = message.content.split(/\s+/g)[0].slice(prefix.length).toLowerCase();
        const content = message.content.replace(new RegExp(`^${prefix}${command} `, 'i'), '');

        let res;
        try {
            res = await Paste(command, content);
        } catch(e) {
            return message.reply(this.Embed.fail(e.message ?? 'An error occurred!'));
        }

        return message.reply(this.Embed.success(`
        ${content.length} characters posted!
        ${res}
        `));
    }
}