import { Command } from '../../Structures/Command.js';
import { Message, MessageEmbed } from 'discord.js';
import { fetchDocs, docs, docsLookup, Class, Typedef, External } from "../../lib/Backend/DiscordJS.js";

await fetchDocs();

export default class extends Command {
    constructor() {
        super(
            [
                'Discord.js docs.',
                'ClientOptions'
            ], 
            [ /* No extra perms needed */ ],
            {
                name: 'docs',
                folder: 'Fun',
                aliases: [ 'djs', 'discord.js' ],
                args: [1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const all = Object.keys(docsLookup)
            .map(k => docsLookup[k].map(i => i.toLowerCase()))
            .flat();

        const [base, ...params] = args.join(' ').split(/[^A-z0-9]/g);
        if(!all.includes(base.toLowerCase())) {
            return message.channel.send(this.Embed.fail(`No search found for ${base.slice(0, 100)}!`));
        }

        const first: Class | Typedef | External = [ 'classes', /*'interfaces',*/ 'typedefs', 'externals' ]
            .map(k => docs[k].filter(n => n.name.toLowerCase() === base.toLowerCase()))
            .filter(a => a.length > 0)
            .flat()
            .shift();

        let embed: MessageEmbed;
        const url = `https://github.com/discordjs/discord.js/blob/stable/${first.meta.path}/${first.meta.file}#L${first.meta.line}`;
        if('see' in first) { // Externals
            embed = this.Embed.success(`
            **__[${first.name}](${url})__**
            ${first.see.map(u => u.match(/{@link (.*)}/)?.[1]).join('\n')}
            `);
        } else if('type' in first) { // Typedef
            if(params.length === 0 || !first.props || first.props.length === 0) {
                embed = this.Embed.success()
                    .setDescription(`
                    **__[${first.name}](${url})__**
                    ${first.description ?? ''}
                    `)
                    .addField('**Type:**', first.type.flat(3).join('\n'));
            } else {
                const prop = first.props
                    .filter(p => p.name.toLowerCase() === params[0].toLowerCase())
                    .shift();

                if(!prop) {
                    embed = this.Embed.fail(`No search found for ${first.name}#${params[0]}!`);
                } else {
                    embed = this.Embed.success()
                        .setDescription(`
                        **__[${first.name}#${prop.name}](${url})__**
                        ${prop.description}
                        `)
                        .addFields(
                            { name: '**Default:**', value: prop.default ?? 'None', inline: true },
                            { name: '**Optional:**', value: Boolean(prop.optional), inline: true },
                            { name: '**Type:**', value: prop.type.flat(3).join(', '), inline: true }
                        );
                }
            }
        } else { // Class
            if(params.length === 0 || !first.props || first.props.length === 0) {
                embed = this.Embed.success()
                    .setDescription(`
                    **__[${first.name}](${url})__**
                    ${first.description ?? ''}
                    `)
                    .addField('**Extends:**', first.extends?.flat(3).join('\n') ?? 'None');
            } else {
                const prop = first.props
                    .filter(p => p.name.toLowerCase() === params[0].toLowerCase())
                    .shift();

                if(!prop) {
                    embed = this.Embed.fail(`No search found for ${first.name}#${params[0]}!`);
                } else {
                    embed = this.Embed.success()
                        .setDescription(`
                        **__[${first.name}#${prop.name}](${url})__**
                        ${prop.description}
                        `)
                        .addFields(
                            { name: '**Access:**', value: prop.access ?? 'Public', inline: true },
                            { name: '**Type:**', value: prop.type.flat(3).join(''), inline: true }
                        );
                }
            }
        }

        return message.channel.send(embed);
    }
}