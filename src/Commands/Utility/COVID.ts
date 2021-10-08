import { bold } from '@discordjs/builders';
import { Message } from 'discord.js';
import { fromCache, start } from '../../lib/Packages/COVID.js';
import { once } from '../../lib/Utility/Memoize.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

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
            args: [1]
        });
    }

    async init(message: Message, { content }: Arguments) {
        await mw();

        const locale = message.guild!.preferredLocale;
        
        // providing a lone city name will no longer be valid,
        // a state *must* also be provided from now on.
        // for example, `!covid albany` won't work but `!covid albany, new york` should.

        const loc = fromCache(content);
        if (loc === null || !loc.result)
            return this.Embed.generic(this, `No location with that query was found.`);

        if (loc.type === 'city') {
            return this.Embed.success(`[Data Provided by JHU](https://github.com/CSSEGISandData/COVID-19)`)
                .setTitle(`${loc.result.Combined_Key} COVID-19 Stats`)
                .addField(bold('Active Cases:'), loc.result.Active?.toLocaleString(locale) ?? 'N/A', true)
                .addField(bold('Total Cases:'), loc.result.Confirmed?.toLocaleString(locale) ?? 'N/A', true)
                .addField('\u200b', '\u200b', true)
                .addField(bold('Recovered:'), loc.result.Recovered?.toLocaleString(locale) ?? 'N/A', true)
                .addField(bold('Deaths:'), loc.result.Deaths?.toLocaleString(locale) ?? 'N/A', true)
                .addField('\u200b', '\u200b', true);     
        } else if (loc.type === 'state,province') {
            const active = loc.result.reduce((a, b) => a + Number(b.Active), 0) || 'N/A';
            const confirmed = loc.result.reduce((a, b) => a + Number(b.Confirmed), 0) || 'N/A';
            const recovered = loc.result.reduce((a, b) => a + Number(b.Recovered), 0) || 'N/A';
            const deaths = loc.result.reduce((a, b) => a + Number(b.Deaths), 0) || 'N/A';

            return this.Embed.success(`
            Out of ${loc.result.length} cities/provinces in ${loc.result[0].Province_State}

            [Data Provided by JHU](https://github.com/CSSEGISandData/COVID-19)
            `)
                .setTitle(`${loc.result[0].Province_State}, ${loc.result[0].Country_Region} COVID-19 Stats`)
                .addField(bold('Active Cases:'), active.toLocaleString(locale) ?? 'N/A', true)
                .addField(bold('Total Cases:'), confirmed.toLocaleString(locale) ?? 'N/A', true)
                .addField('\u200b', '\u200b', true)
                .addField(bold('Recovered:'), recovered.toLocaleString(locale) ?? 'N/A', true)
                .addField(bold('Deaths:'), deaths.toLocaleString(locale) ?? 'N/A', true)
                .addField('\u200b', '\u200b', true);  
        } else {
            if (loc.result.length === 1) {
                return this.Embed.success(`[Data Provided by JHU](https://github.com/CSSEGISandData/COVID-19)`)
                    .setTitle(`${loc.result[0].Combined_Key} COVID-19 Stats`)
                    .addField(bold('Active Cases:'), loc.result[0].Active?.toLocaleString(locale) ?? 'N/A', true)
                    .addField(bold('Total Cases:'), loc.result[0].Confirmed?.toLocaleString(locale) ?? 'N/A', true)
                    .addField('\u200b', '\u200b', true)
                    .addField(bold('Recovered:'), loc.result[0].Recovered?.toLocaleString(locale) ?? 'N/A', true)
                    .addField(bold('Deaths:'), loc.result[0].Deaths?.toLocaleString(locale) ?? 'N/A', true)
                    .addField('\u200b', '\u200b', true);  
            }

            const totalStates = new Set(loc.result.map(e => e.Province_State)).size;
            const active = loc.result.reduce((a, b) => a + Number(b.Active), 0) || 'N/A';
            const confirmed = loc.result.reduce((a, b) => a + Number(b.Confirmed), 0) || 'N/A';
            const recovered = loc.result.reduce((a, b) => a + Number(b.Recovered), 0) || 'N/A';
            const deaths = loc.result.reduce((a, b) => a + Number(b.Deaths), 0) || 'N/A';

            return this.Embed.success(`
            Out of ${totalStates} states/provinces in ${loc.result[0].Country_Region}

            [Data Provided by JHU](https://github.com/CSSEGISandData/COVID-19)
            `)
                .setTitle(`${loc.result[0].Country_Region} COVID-19 Stats`)
                .addField(bold('Active Cases:'), active.toLocaleString(locale) ?? 'N/A', true)
                .addField(bold('Total Cases:'), confirmed.toLocaleString(locale) ?? 'N/A', true)
                .addField('\u200b', '\u200b', true)
                .addField(bold('Recovered:'), recovered.toLocaleString(locale) ?? 'N/A', true)
                .addField(bold('Deaths:'), deaths.toLocaleString(locale) ?? 'N/A', true)
                .addField('\u200b', '\u200b', true);  
        }
    }
}