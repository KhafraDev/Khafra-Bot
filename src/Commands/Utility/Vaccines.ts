import { Command, Arguments } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Message } from 'discord.js';
import { fetchAppointments } from '@khaf/vaccines';

type Radius = Parameters<typeof fetchAppointments>[1]
const radius = [1, 5, 15, 20, 25];

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Find vaccine appointments near you',
                '[zip code]'
            ],
			{
                name: 'vax',
                folder: 'Utility',
                args: [1, 2],
                aliases: [ 'vaxx', 'vacc', 'vaccine', 'vaccines' ]
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        const [zipcode, rad] = args;
        if (!/^\d{5}$/.test(zipcode))
            return this.Embed.fail(`Invalid zip code. This command only works in the U.S. for now.`);
        else if (rad && !radius.includes(Number(rad)))
            return this.Embed.fail(`Only radiuses of 1, 5, 15, 20, and 25 are allowed (default 25).`);

        const available = await fetchAppointments(zipcode, rad ? Number(rad) as Radius : undefined);

        if (!available.providers?.length)
            return this.Embed.fail(`No locations near you were found in a ${rad} mile radius.`);

        let desc = '', i = 0;
        while (desc.length < 2048) {
            const loc = available.providers[i++];
            const chunk = `[**${loc.distance} miles**]: \`\`${loc.name.split(' #')[0]}\`\`; ${loc.address1} ${loc.city}, ${loc.zip}.\n`
            if (chunk.length + desc.length > 2048) break;

            desc += chunk;
        }

        return this.Embed.success(desc)
            .setTitle(`Vaccines Near ${zipcode}`);
    }
}