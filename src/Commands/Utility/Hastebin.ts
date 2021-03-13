import { Command } from '../../Structures/Command.js';
import { hasteServers, Paste } from '../../lib/Backend/Hastebin/Hastebin.js';
import { Message } from 'discord.js';
import { GuildSettings } from '../../lib/types/Collections.js';
import config from '../../../config.json';
import { RegisterCommand } from '../../Structures/Decorator.js';

const { prefix: defPrefix } = config;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Upload a paste to Hastebin, Hatebin, or Nomsy!',
                'hatebin const bot = KhafraClient;',
                'Nomsy who knew Heroku CDN was trash? Not hastebin.',
                'hastebin Hello, world!'
            ],
			{
                name: 'hastebin',
                folder: 'Utility',
                args: [1],
                aliases: hasteServers.flatMap(s => s.alias)
            }
        );
    }

    async init(message: Message, _args: string[], settings: GuildSettings) {
        // args replaces all whitespace characters, including new lines.
        // to prevent this, we re-format the message's content.
        const prefix: string = settings?.prefix ?? defPrefix;
        // this is always valid because it uses the command's name
        const command = message.content.split(/\s+/g)[0].slice(prefix.length).toLowerCase();
        const content = message.content.replace(new RegExp(`^${prefix}${command} `, 'i'), '');

        const res = await Paste(command, content);
        
        return this.Embed.success(`
        ${content.length} characters posted!
        ${res}
        `);
    }
}