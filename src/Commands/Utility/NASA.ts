import { apodFetchDaily } from '../../lib/Backend/NASA.js';
import { nasaDBTransaction } from '../../lib/Migration/NASA.js';
import { once } from '../../lib/Utility/Memoize.js';
import { Command } from '../../Structures/Command.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

interface APOD {
    title: string
    link: string
    copyright: string | null
}

const mw = once(async () => {
    await apodFetchDaily();
    await nasaDBTransaction();
});

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a random Astronomy Photo of the Day (APOD) supplied by NASA.'
            ],
			{
                name: 'apod',
                folder: 'Utility',
                args: [0, 0],
                aliases: [ 'nasa' ]
            }
        );
    }

    async init() {
        await mw();
        
        const { rows } = await pool.query<APOD>(`
            SELECT * FROM kbAPOD TABLESAMPLE BERNOULLI(.5) ORDER BY random() LIMIT 1;
        `);

        if (rows.length === 0)
            return this.Embed.fail('Entries are being fetched from NASA, give it a few minutes. :)');

        const embed = this.Embed.success()
            .setTitle(rows[0].title)
            .setImage(rows[0].link);
            
        rows[0].copyright !== null && embed.setFooter(`© ${rows[0].copyright}`);
        return embed;
    }
}
