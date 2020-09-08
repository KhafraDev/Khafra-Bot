import { Command } from "../../Structures/Command";
import { hasteServers, paste } from "../../lib/Backend/Hastebin/Hastebin";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { URL } from "url";

export default class extends Command {
    constructor() {
        super(
            [
                'Upload a paste to Hastebin, Hatebin, or Nomsy!',
                'hatebin const bot = KhafraClient;',
                'Nomsy who knew Heroku CDN was trash? Not hastebin.',
                'Hello, world!'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'hastebin',
                folder: 'Utility',
                args: [1],
                aliases: Object.keys(hasteServers).slice(1) // dynamic aliases :o
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        // if command has a separate server in it
        // ie. !hastebin nomsy hello! -> hello!
        //     !hastebin hello!       -> hello!
        const [server, content] = Object.keys(hasteServers).indexOf(args[0].toLowerCase()) > -1 
            ? [args[0], args.slice(1).join(' ')]
            : ['hastebin', args.join(' ')];

        const res = await paste(content, server);
        if('error' in res) {
            return message.channel.send(Embed.fail(res.error));
        } else if('status' in res) {
            return message.channel.send(Embed.fail(`
            Received status ${res.status} (${res.statusText}).
            Try a different server!
            `));
        }

        const srv = Object.entries(hasteServers).filter(([n, u]) => n === server || u === server);
        const url = new URL(srv.shift().pop()).origin;
        return message.channel.send(Embed.success(`${url}/${res.key}`));
    }
}