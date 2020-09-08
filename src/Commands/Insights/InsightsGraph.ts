import { Command } from "../../Structures/Command";
import { join } from "path";
import { Message } from "discord.js";
import { mkdir, stat } from "fs/promises";
import { readFileSync, Stats } from 'fs';
import { execFile } from "child_process";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { Insights } from "../../lib/types/Collections";

const { outDir } = JSON.parse(readFileSync(join(process.cwd(), 'tsconfig.json')).toString()).compilerOptions;
const outPath = join(process.cwd(), outDir, 'lib/Images/');
const pyPath = join(process.cwd(), 'src/lib/Backend/Py/InsightsGraph.py');
let updated = false;

export default class extends Command {
    constructor() {
        super(
            [
                'Insights: get a graph of the people who have joined today! The mis-matched colors are Discord\'s fault, I can\'t do anything about them!',
                '10', ''
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

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        }

        if(!updated) {
            await mkdir(outPath, { recursive: true });
            updated = true;
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
            const embed = Embed.success()
                .attachFiles([ filePath ])
                .setImage(`attachment://${message.guild.id}.jpg`)
                .setFooter('Last updated')
                .setTimestamp(stats.mtimeMs)

            return message.channel.send(embed);
        }

        const days = args.length > 0 && !isNaN(+args[0]) ? +args[0] : 5;

        const client = await pool.insights.connect();
        const collection = client.db('khafrabot').collection('insights');

        const guild = await collection.findOne({ id: message.guild.id }) as Insights;

        if(!guild) {
            return message.channel.send(Embed.fail('No insights available - yet!'));
        }

        const mapped = Object.entries(guild.daily)
            .reverse()
            .slice(0, days <= 100 ? days : 10)
            .reduce((a, [k, v]) => {
                return a[0].push(k), a[1].push((v as { joined: number }).joined), a;
            }, [[], []]);

        /* 
        py src/lib/Backend/Py/InsightsGraph.py 2020-08-16,2020-08-15,2020-08-14 10,20,15 guildid /path/to/folder/   
           ^---------------------------------^ ^------------------------------^ ^------^ ^-----^ ^--------------^
                            |                                   |                   |       |           |
                        file location               dates for x-axis labels     y values    ..       output dir
        */
        
        execFile('python', [pyPath, mapped[0].join(','), mapped[1].join(','), message.guild.id, outPath], err => {
            if(err) {
                return message.channel.send(Embed.fail(`
                An unexpected error occurred!
                \`\`${err.toString()}\`\`
                `));
            }

            const embed = Embed.success()
                .attachFiles([ filePath ])
                .setImage(`attachment://${message.guild.id}.jpg`)
                
            return message.channel.send(embed);
        });
    }
}