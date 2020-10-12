import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo";
import { Insights } from "../../lib/types/Collections";
import ms from "ms";
import { formatDate } from "../../lib/Utility/Date";

type valueof<T> = T[keyof T];

export default class extends Command {
    constructor() {
        super(
            [
                'Insights: Get stats between multiple days!',
                '', '3d'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'insights',
                folder: 'Insights',
                aliases: [ 'insightdaily', 'insightsdaily', 'insight' ],
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'VIEW_GUILD_INSIGHTS' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms.call(this, true));
        }

        const days = args.length === 1 ? Math.floor((ms(args[0]) / 86400000)) : 5;
        if(!days) {
            return message.channel.send(this.Embed.fail('Invalid number of days provided!'));
        } else if(days < 2 || days > 7) {
            return message.channel.send(this.Embed.fail('Only numbers between 2 and 7, please!'));
        }

        const client = await pool.insights.connect();
        const collection = client.db('khafrabot').collection('insights');
        const value = await collection.findOne<Insights>({ id: message.guild.id });
        if(!value) {
            return message.channel.send(this.Embed.fail('No insights available - yet!'));
        } else if(Object.keys(value).length < 2) {
            return message.channel.send(this.Embed.fail('Only one day tracked so far. Wait until tomorrow!'));
        }

        // last date is today
        const lastIsToday = Object.keys(value.daily).pop() === formatDate('MM-DD-YYYY', new Date());

        const joins: (valueof<Insights['daily']> & { change?: number })[] = Object
            .values(value.daily)
            .reverse()
            .slice(lastIsToday ? 1 : 0, lastIsToday ? days + 1 : days)
            .reverse()
            .map((j, i, a) => i !== 0 ? Object.assign(j, { 
                change: (j.joined - a[i-1].joined) / a[i-1].joined * 100, 
            }) : j);

        const keys = Object
            .keys(value.daily)
            .reverse()
            .slice(lastIsToday ? 1 : 0, lastIsToday ? days + 1 : days)
            .reverse()

        const formatted = joins
            .map((d, i) => `\`\`${keys[i]}\`\`: ${d.joined} joins | ${d.left} left | ${d.change?.toFixed(2) ?? 0}% ${d.change > 0 ? 'increase' : 'decrease'}`)
            .join('\n');

        const embed = this.Embed.success(formatted)
            .setTitle(`Insights over ${days} days.`);

        return message.channel.send(embed);
    }
}