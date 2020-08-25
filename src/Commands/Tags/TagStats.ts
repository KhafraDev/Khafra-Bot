import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { Tags } from "../../lib/types/Collections";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: get guild stats on tags.',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tagsstats',
                folder: 'Tags',
                aliases: [ 'tagstat', 'tagsstat', 'tagsstats' ],
                cooldown: 5,
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const tags = await collection.findOne(
            { id: message.guild.id }
        ) as Tags;
        
        if(!tags) {
            return message.channel.send(Embed.fail(`
            Tag have to be implemented by an administrator with the \`\`taginit\`\` command!
            `));
        }

        const embed = Embed.success()
            .addField('**Users:**', `\`\`${Object.keys(tags.tags).length}\`\` users`, true)
            .setTimestamp();

        return message.channel.send(embed);
    }
}