import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { formatDate } from "../../lib/Utility/Date";
import { Tags } from "../../lib/types/Collections";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: get info on a tag.',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tagsinfo',
                folder: 'Tags',
                aliases: [ 'taginfo', 'tagsget', 'tagget' ],
                cooldown: 5,
                guildOnly: true
            }
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
        ) as Tags;
        
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