import { Command } from "../../Structures/Command";
import { Message, User } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { Tags } from "../../lib/types/Collections";
import { formatDate } from "../../lib/Backend/Guardian/Utility/Date";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: get info on a tag.',
                'first', 'second', 'mytagname'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tagsinfo',
                folder: 'Tags',
                args: [1, 1],
                aliases: [ 'taginfo', 'tagsget', 'tagget' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const tag = await collection.findOne({
            id: message.guild.id,
            name: args[0]
        }) as Tags;
        
        if(!tag) {
            return message.channel.send(Embed.fail('No tag with that name exists!'));
        }

        let user: User | 'Not found.';
        try {
            user = await message.client.users.fetch(tag.owner);
        } catch {
            user = 'Not found.';
        }

        const transfer = `${tag.history?.[0].old} ➡️ ${tag.history?.[0].new} (${formatDate('DD-MM-YYYY, hh:mm:ssA', tag.history?.[0].now)})`;
        const embed = Embed.success()
            .setDescription(`
            Tag has changed ownership **${tag.history?.length ?? 0}** time(s).
            Latest transfer:
            ${tag.history?.length > 0 ? transfer : 'Never transferred!'}
            `)
            .addField('**Name:**', tag.name, true)
            .addField('**Owner:**', user.toString(), true)
            .setFooter('Created:')
            .setTimestamp(tag.created);

        return message.channel.send(embed);
    }
}