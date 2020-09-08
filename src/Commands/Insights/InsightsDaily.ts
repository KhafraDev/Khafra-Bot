import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo";
import Embed from "../../Structures/Embed";
import { formatDate } from "../../lib/Utility/Date";
import { Insights } from "../../lib/types/Collections";

export default class extends Command {
    constructor() {
        super(
            [
                'Insights: Get the daily stats!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'insightsdaily',
                folder: 'Insights',
                aliases: [ 'insightdaily' ],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        }

        const client = await pool.insights.connect();
        const collection = client.db('khafrabot').collection('insights');

        const value = await collection.findOne({ id: message.guild.id }) as Insights;
        if(!value) {
            return message.channel.send(Embed.fail('No insights available - yet!'));
        }
        
        const date = formatDate('MM-DD-YYYY', new Date());
        const daily = value.daily[date];
        if(Object.keys(value.daily).length < 2) {
            return message.channel.send(Embed.success(`
            So far \`\`${daily?.joined ?? 0}\`\` people have joined the server today and \`\`${daily?.left ?? 0}\`\` left.
            
            There is a 0% change from yesterday.
            `));
        } else {
            const yesterday = formatDate('MM-DD-YYYY', new Date(new Date().setDate(new Date().getDate() - 1)));
            const change = ((daily?.joined ?? 0) - (value.daily[yesterday]?.joined ?? 0))
                            / (value.daily[yesterday]?.joined ?? 0) * 100;

            return message.channel.send(Embed.success(`
            Yesterday \`\`${value.daily[yesterday]?.joined ?? 0}\`\` people joined and \`\`${value.daily[yesterday]?.left ?? 0}\`\` left.
            Today \`\`${value.daily[date]?.joined ?? 0}\`\` people joined and \`\`${value.daily[date]?.left}\`\` left.

            There is a ${Math.abs(change)}% ${change > 0 ? 'increase' : 'decrease'} in members joining today.
            `));
        }
    }
}