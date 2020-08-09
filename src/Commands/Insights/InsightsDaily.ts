import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo";
import Embed from "../../Structures/Embed";
import { formatDate } from "../../Backend/Utility/Date";

export default class extends Command {
    constructor() {
        super(
            { name: 'insightsdaily', folder: 'Insights' },
            [
                'Insights: Get the daily stats!',
                ''
            ],
            [ /* No extra perms needed */ ],
            60,
            [ 'insightdaily' ]
        );
    }

    async init(message: Message) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        }

        const client = await pool.insights.connect();
        const collection = client.db('khafrabot').collection('insights');

        const value = await collection.findOne({ id: message.guild.id });
        if(!value) {
            return message.channel.send(Embed.fail(`
            Insights have to be implemented by an administrator!

            Let them know to use the \`\`!insightsinit\`\` command!
            `));
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