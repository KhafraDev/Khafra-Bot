import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo";
import { Tags } from "../../lib/types/Collections";
import KhafraClient from "../../Bot/KhafraBot";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: retrieve a tag or perform an action with one (edit, delete, etc.)!',
                'first', 'delete first', 'edit first This is actually the second tag.'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tags',
                folder: 'Tags',
                args: [1],
                aliases: [ 'tag' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const TagLike = Array.from(KhafraClient.Commands.values())
            .filter(c => c.settings.name.indexOf('tag') === 0);
        
        const TagCommands = new Set(TagLike
            .map(c => [...(c.settings.aliases ?? []), c.settings.name])
            .flat()
            .map(name => name.replace(/tags?/, ''))
            .filter(left => left.length > 0)
        ); // Set(7) { 'create', 'delete', 'edit', 'give', 'info', 'get', 'init' }

        const [tagCmdOrName, ...arg] = args;
        
        if(TagCommands.has(tagCmdOrName.replace(/tags?/, ''))) {
            return KhafraClient.Commands.get(`tags${tagCmdOrName.replace(/tags?/, '')}`)?.init(message, arg);
        }

        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const tag = await collection.findOne({
            id: message.guild.id,
            name: tagCmdOrName
        }) as Tags;

        if(!tag) {
            return message.channel.send(Embed.fail(`
            No tag found! Create it with \`\`tag create ${tagCmdOrName.slice(0, 25)} My very own tag!\`\`!
            `));
        }

        return message.channel.send(Embed.success(tag.content));
    }
}