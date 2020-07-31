import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { Mongo } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            'tags',
            [
                'Tags: retrieve a tag!',
                'first', 'hello'
            ],
            [ /* No extra perms needed */ ],
            10,
            [ 'tag' ]
        );
    }

    async init(message: Message, args: string[]) {
        const client = await Mongo.connect();
        const collection = client.db('khafrabot').collection('tags');

        const tag = await collection.findOne(
            { 
                $and: [
                    { id: message.guild.id },
                    { [`tags.${args[0].toLowerCase()}`]: { $exists: true } }
                ],
            }
        );
        
        if(!tag) {
            return message.channel.send(Embed.fail(`
            Tag doesn't exist! Has an administrator set-up tags in this guild using \`\`taginit\`\`?
            `));
        }

        const embed = Embed.success(`\`\`${tag.tags[args[0].toLowerCase()].value}\`\``)
            .setTimestamp()
            .setFooter(`${message.author.username}`, message.author.displayAvatarURL())

        return message.channel.send(embed);
    }
}