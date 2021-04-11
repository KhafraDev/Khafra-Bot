import { EmbedFieldData, Message } from 'discord.js';
import { cache, start } from '../../lib/Backend/COVID.js';
import { compareTwoStrings } from '../../lib/Utility/CompareStrings.js';
import { once } from '../../lib/Utility/Memoize.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

enum Regions {
    'us-central' = 'Austin',
    'us-east' = 'New York',
    'us-south' = 'Miami-Dade',
    'us-west' = 'Sacramento',
    'brazil' = 'Rio de Janeiro',
    'europe' = 'Berlin', 
    'hongkong' = 'Hong Kong',
    'india' = 'Delhi',
    'japan' = 'Tokyo',
    'russia' = 'Moscow',
    'singapore' = 'Singapore',
    'southafrica' = 'South Africa',
    'sydney' = 'New South Wales'
}

type GetFromArray<T extends Set<unknown>> = T extends Set<infer U>
    ? U
    : never

const mw = once(start);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'Get stats about COVID-19.',
            '', 'New York', 'Polk, Iowa'
        ], {
            name: 'covid',
            folder: 'Utility',
            args: [0]
        });
    }

    async init(message: Message, { args }: Arguments) {
        await mw();
        
        const area = (
            args.length === 0
                ? Regions[message.guild.region as keyof typeof Regions]
                : args.join(' ')
        ).toLowerCase();

        const item = [...cache].filter(place => 
            place.Country_Region.toLowerCase() === area ||
            place.Province_State?.toLowerCase() === area ||
            place.Admin2?.toLowerCase() === area ||
            place.Combined_Key.toLowerCase().includes(area)
        );

        const country = item.map(c => c.Country_Region);
        const most = country
            .sort((a,b) => country.filter(v => v === a).length - country.filter(v => v === b).length)
            .pop();
        const city = item.filter(c => 
            c.Province_State?.toLowerCase() === area && 
            c.Country_Region === most
        );

        if (item.length === 0)
            return this.Embed.fail(`No data for this location was supplied by \`\`JHU CSSE COVID-19 Data\`\`!`);

        let bestResult: GetFromArray<typeof cache> | null = null;

        if (city.length > 0) {
            const total = city.reduce((a, b) => {
                Object.keys(a).forEach(k => a[k as keyof typeof a] += b[k as keyof typeof b] as number);
                return a;
            }, {
                Confirmed: 0,
                Recovered: 0,
                Deaths: 0,
                Active: 0,
                People_Tested: 0
            });

            bestResult = { ...city[0], ...total };
        } else {
            bestResult = item.slice(0, 20).sort((a, b) =>
                compareTwoStrings(b.Combined_Key.toLowerCase(), area) - compareTwoStrings(a.Combined_Key.toLowerCase(), area)
            ).shift()!;
        }

        const fields: EmbedFieldData[] = [];
        if (bestResult.Admin2 && city.length === 0)
            fields.push({ name: `**City:**`, value: bestResult.Admin2 });
        if (bestResult.Province_State) 
            fields.push({ name: `**Province/State:**`, value: bestResult.Province_State });
        
        fields.push({ name: `**Country:**`, value: bestResult.Country_Region });
        fields.push({ name: `**Total Cases:**`, value: bestResult.Confirmed.toLocaleString() });
        fields.push({ name: `**Deaths:**`, value: bestResult.Deaths.toLocaleString() });
        if (bestResult.Country_Region !== 'US') // https://github.com/CSSEGISandData/COVID-19/issues/3464
            fields.push({ name: `**Recovered:**`, value: bestResult.Recovered.toLocaleString() });
        fields.push({ name: `**Active:**`, value: bestResult.Active.toLocaleString() });

        return this.Embed.success()
            .setTitle(`Daily COVID-19 stats reported in ${city.length > 0 ? bestResult.Province_State : bestResult.Combined_Key}`)
            .addFields(fields.map(f => ({ ...f, inline: true })))
            .setTimestamp(new Date(bestResult.Last_Update))
            .setDescription(`
            Data supplied by \`\`JHU CSSE COVID-19 Data\`\` (https://github.com/CSSEGISandData/COVID-19)`
            );
    }
}