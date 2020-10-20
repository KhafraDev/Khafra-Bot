import { Command } from "../../Structures/Command.js";
import { Message, User } from "discord.js";
import { pool } from "../../Structures/Database/Mongo.js";
import { Tags } from "../../lib/types/Collections";
import { formatDate } from "../../lib/Utility/Date.js";

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
            return message.channel.send(this.Embed.generic());
        }

        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const tag = await collection.findOne<Tags>({
            id: message.guild.id,
            name: args[0]
        });
        
        if(!tag) {
            return message.channel.send(this.Embed.fail('No tag with that name exists!'));
        }

        let user: User | 'Not found.';
        try {
            user = await message.client.users.fetch(tag.owner);
        } catch {
            user = 'Not found.';
        }

        const transfer = `${tag.history?.[0].old} ➡️ ${tag.history?.[0].new} (${formatDate('DD-MM-YYYY, hh:mm:ssA', tag.history?.[0].now)})`;
        const embed = this.Embed.success()
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