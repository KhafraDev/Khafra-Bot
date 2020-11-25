import { Command } from "../../../Structures/Command.js";
import { Message, MessageEmbed, MessageReaction, User } from "discord.js";
import fetch from 'node-fetch';
import parse5, { 
    DefaultTreeParentNode as DTPN, 
    DefaultTreeChildNode as DTCN, 
    DefaultTreeElement as DTE,
    DefaultTreeTextNode as DTTN
} from 'parse5';
import { randomInt } from 'crypto';
import { promisify } from "util";
import { cooldown } from '../../../Structures/Cooldown/CommandCooldown.js';

const randInt: (max: number) => Promise<number> = promisify(randomInt);

const getLi = (html: string) => {
    const document = parse5.parse(html);
    const els = (document as DTPN).childNodes; // elements in the page's body
    const li = [];

    while(els.length !== 0) {
        const el = els.shift() as DTCN | DTPN;
        if(el.nodeName === 'li') {
            if(
                (el as DTCN).parentNode.nodeName === 'ol' && 
                (((el as DTCN).parentNode as unknown as DTCN).parentNode as DTE).attrs[0].value !== 'links popular') 
            {
                li.push(el);
            }
        } else if((el as DTPN).childNodes?.length > 0) {
            els.push(...(el as DTPN).childNodes);
        }
    }

    return li as (DTE & DTPN)[];
}

export const refreshCache = async () => {
    let resp;
    try {
        resp = await fetch('https://www.mcsweeneys.net/articles/the-complete-listing-so-far-atrocities-1-940');
    } catch(e) {
        return Promise.reject(e);
    }

    if(!resp.ok) {
        return Promise.reject(`Received status ${resp.status} (${resp.statusText})!`);
    }
    const html = await resp.text();
    const li = getLi(html);
    
    // some elements haven't been assigned to an index
    const images = li.map(i => (i.childNodes as DTE[]).filter(n => n.nodeName === 'img').shift()?.attrs[0].value ?? null);
    const text = li
        .map(i => i.childNodes.filter(n => ['#text', 'a'].includes(n.nodeName)))
        .map(t => t.map(e => e.nodeName === '#text' 
            ? (e as DTTN).value 
            : `[${((e as DTE).childNodes[0] as DTTN).value}](${(e as DTE).attrs[0].value})`
        ).slice(1).join('').trim());
    const dates = li.map(i => ((i.childNodes as DTPN[]).filter(n => n.nodeName === 'b')[0].childNodes[0] as DTTN).value)

    return Array.from({ length: images.length }, (_, k) => ({
        image: images[k],
        text: text[k],
        date: dates[k]
    }));
}

export let cache: { image: string, text: string, date: string }[] = [];
try {
    const items = await refreshCache();
    cache.push(...items);
} catch {}

const key = (u: string) => {
    u = u.toLowerCase();
    if(u.includes('red')) {
        return '#E70B2F';
    } else if(u.includes('bullet')) {
        return '#000000';
    } else if(u.includes('lightblue')) {
        return '#8DD1F8';
    } else if(u.includes('yellow')) {
        return '#F1F442';
    } else if(u.includes('darkpurple')) {
        return '#8405C6';
    } else if(u.includes('pink')) {
        return '#FC6AF0';
    } else if(u.includes('orange')) {
        return '#F17937';
    } else if(u.includes('green')) {
        return '#07B24B';
    }
}

export default class extends Command {
    cooldown = cooldown(1, 60000);
    
    constructor() {
        super(
            [
                'Get atrocities committed by Trump on a given day (or a random day)!',
                'October 12, 2020',
            ],
			{
                name: 'trump',
                folder: 'Utility',
                args: [0, 3] // 0 = random, 3 = February 10, 2017
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!message.guild.me.permissionsIn(message.channel).has('MANAGE_MESSAGES')) {
            return message.reply(this.Embed.fail(`
            I don't have permission to manage messages!
            `));
        } else if(cache.length === 0) {
            return message.channel.send(this.Embed.fail(`An error occurred refreshing cache on bot startup.`));
        }
        
        const item = args.length === 0 
            ? [cache[await randInt(cache.length)]]
            : cache.filter(({ date }) => date.toLowerCase() === args.join(' ').toLowerCase());      
            
        if(!item || item.length === 0) {
            return message.reply(this.Embed.fail(`
            Wow! No atrocities on that day.
            `));
        } else if(item.length === 1) {
            const { text, date, image } = item.shift();
            return message.reply(new MessageEmbed().setColor(key(image)).setDescription(`${date} ${text}`));
        }

        let i = 0;
        const e = () => item[i] 
            ? new MessageEmbed()
                .setColor(key(item[i].image))
                .setDescription(`
                ${item[i].date} ${item[i].text}

                React with ▶️ to go to the next atrocity, or ◀️ to go to the previous.
                Bot might not react to your message due to Discord's terrible rate-limits.
                `) 
                .setFooter(`Page ${i+1} of ${item.length}`)
            : null;

        const m = await message.reply(e());
        if(!m) {
            return;
        }

        if(this.cooldown(message.guild.id)) {
            await m.react('▶️');
            await m.react('◀️');
        }

        const filter = (r: MessageReaction, u: User) => ['▶️', '◀️'].includes(r.emoji.name) && u.id === message.author.id;
        const collector = m.createReactionCollector(filter, { max: item.length * 2, time: 60000 });
        collector.on('collect', async reaction => {
            if(!m || m.deleted) {
                return collector.stop();
            }

            if(reaction.emoji.name === '▶️') {
                if(item[i + 1]) {
                    i++;
                }
            } else {
                if(item[i - 1]) {
                    i--;
                }
            }

            await m.edit(e());
        });
        collector.on('end', () => {
            try {
                return m.reactions.removeAll();
            } catch {}
        });
    }
}