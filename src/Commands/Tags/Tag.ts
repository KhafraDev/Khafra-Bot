import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { Tags } from "../../lib/types/Collections";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: retrieve a tag!',
                'first', 'hello'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tags',
                folder: 'Tags',
                aliases: [ 'tag' ],
                cooldown: 5,
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.fail('No tag name provided! Use the ``help`` command for usage!'));
        }

        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const tag = await collection.findOne(
            { 
                $and: [
                    { id: message.guild.id },
                    { [`tags.${args[0].toLowerCase()}`]: { $exists: true } }
                ],
            }
        ) as Tags;
        
        if(!tag) {
            return message.channel.send(Embed.fail(`
            Tag doesn't exist! Has an administrator set-up tags in this guild using \`\`taginit\`\`?
            `));
        }

        const embed = Embed.success(`\`\`${tag.tags[args[0]?.toLowerCase()].value}\`\``)
            .setTimestamp()
            .setFooter(`${message.author.username}`, message.author.displayAvatarURL())

        return message.channel.send(embed);
    }
}