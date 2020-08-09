import { Command } from "../../Structures/Command";
import { Message, User } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { formatDate } from "../../Backend/Utility/Date";

export default class extends Command {
    constructor() {
        super(
            { name: 'tagsinfo', folder: 'Tags' },
            [
                'Tags: get info on a tag.',
                ''
            ],
            [ /* No extra perms needed */ ],
            10,
            [ 'taginfo', 'tagsget', 'tagget' ]
        );
    }

    async init(message: Message, args: string[]) {
        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const tag = await collection.findOne(
            { 
                id: message.guild.id,
                [`tags.${args[0]}`]: { $exists: true } 
            }
        );
        
        if(!tag) {
            return message.channel.send(Embed.fail('No tag with that name exists!'));
        }

        const item = tag.tags[args[0].toLowerCase()];
        const embed = Embed.success()
            .addField('**Name:**', item.name, true)
            .addField('**Owner:**', await message.client.users.fetch(item.owner), true)
            .addField('**Created:**', formatDate('MMMM Do, YYYY hh:mm:ss A t', item.created), true)

        return message.channel.send(embed);
    }
}