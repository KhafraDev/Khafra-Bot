import { Command } from "../../Structures/Command";
import { join } from "path";
import { Message } from "discord.js";
import { stat } from "fs/promises";
import { Stats, mkdirSync } from 'fs';
import { execFile } from "child_process";
import { pool } from "../../Structures/Database/Mongo";
import { Insights } from "../../lib/types/Collections";

const outDir = join(process.cwd(), 'build/src')
const outPath = join(outDir, 'lib/Images/');
const pyPath = join(process.cwd(), 'src/lib/Backend/Py/InsightsGraph.py');
mkdirSync(outPath, { recursive: true });

export default class extends Command {
    constructor() {
        super(
            [
                'Insights: get a graph of the people who have joined today! The mis-matched colors are Discord\'s fault, I can\'t do anything about them!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'insightsgraph',
                folder: 'Insights',
                aliases: [ 'insightgraph' ],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if(!super.userHasPerms(message, [ 'VIEW_GUILD_INSIGHTS' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms.call(this, true));
        }

        const filePath = join(outPath, message.guild.id + '.jpg');

        let stats: Stats;
        // stats gets stats on a file
        // in this case, we check when the file was last modified (if it was)
        // if this fails, it means we should create a new graph
        // which is why the error is silently ignored
        try {
            stats = await stat(filePath);
        } catch {} 

        if(stats && (Date.now() - stats.mtimeMs) / 1000 / 60 < 15) {
            const embed = this.Embed.success()
                .attachFiles([ filePath ])
                .setImage(`attachment://${message.guild.id}.jpg`)
                .setFooter('Last updated')
                .setTimestamp(stats.mtimeMs)

            return message.channel.send(embed);
        }

        const client = await pool.insights.connect();
        const collection = client.db('khafrabot').collection('insights');

        const guild = await collection.findOne<Insights>({ id: message.guild.id });

        if(!guild || Object.keys(guild?.daily ?? {}).length < 2) {
            return message.channel.send(this.Embed.fail('No insights available - yet!'));
        }

        const mapped = Object.entries(guild.daily)
            .reverse()
            .slice(0, 7)
            .reduce((a, [k, v]) => {
                a[0].push(k.slice(0, -5)), a[1].push(v.joined)
                return a;
            }, [[], []]);

        /* 
        py src/lib/Backend/Py/InsightsGraph.py 2020-08-16,2020-08-15,2020-08-14 10,20,15 guildid /path/to/folder/   
           ^---------------------------------^ ^------------------------------^ ^------^ ^-----^ ^--------------^
                            |                                   |                   |       |           |
                        file location               dates for x-axis labels     y values    ..       output dir
        */
        
        execFile('python', [pyPath, mapped[0].join(','), mapped[1].join(','), message.guild.id, outPath], err => {
            if(err) {
                this.logger.log(err);
                return message.channel.send(this.Embed.fail(`An unexpected error occurred!`));
            }

            const embed = this.Embed.success()
                .attachFiles([ filePath ])
                .setImage(`attachment://${message.guild.id}.jpg`)
                
            return message.channel.send(embed);
        });
    }
}