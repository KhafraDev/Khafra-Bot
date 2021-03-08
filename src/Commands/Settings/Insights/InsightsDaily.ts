import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { Insights } from '../../../lib/types/Collections';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { table } from '../../../lib/Utility/CLITable.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Insights: get a list of the number of people who have left and joined the server over the span of a few weeks.'
            ],
			{
                name: 'insights',
                folder: 'Insights',
                aliases: [ 'insight' ],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.VIEW_GUILD_INSIGHTS)) {
            return this.Embed.missing_perms(true);
        }

        const client = await pool.insights.connect();
        const collection = client.db('khafrabot').collection('insights');

        const guild = await collection.findOne<Insights>({ id: message.guild.id });

        if (!guild || Object.keys(guild?.daily ?? {}).length < 2) {
            return this.Embed.fail('No insights available - yet!');
        }

        const dates = Object.keys(guild.daily)
            .slice(-14)
            .reverse();

        const t = table(
            [ 'Dates', 'Joins', 'Leaves' ],
            [
                dates,
                dates.map(d => `${guild.daily[d].joined ?? 0}`),
                dates.map(d => `${guild.daily[d].left ?? 0}`)
            ]
        );

        return this.Embed.success(`\`\`\`${t}\`\`\``);
    }
}