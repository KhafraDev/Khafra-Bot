import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';

import fetch from 'node-fetch';

interface IMCOnline {
    online: true,
	ip: string
	port: number
	debug: {
		ping: boolean
		query: boolean
		srv: boolean
		querymismatch: boolean
		ipinsrv: boolean
		cnameinsrv: boolean
		animatedmotd: boolean
		cachetime: number
	}
	motd: {
		raw: string[]
		clean: string[]
		html: string
	}
	players: {
		online: number
		max: number
		list?: string[]
		uuid?: { [key: string]: string }
	}
	version: string | string[]
	protocol?: number
	hostname?: string
	icon?: string 
	software?: string 
	map: string,
	plugins?: {
		names: string[]
		raw: string[]
	}
	mods?: {
		names: string[]
		raw: string[]
	}
	info?: {
		raw: string[]
		clean: string[]
		html: string[]
	}
}

interface IMCOffline {
    online: false
	ip: string | ''
	port: number | ''
	debug: IMCOnline['debug']
	hostname: string
}

export const fetchMeepOnline = async () => {
    const r = await fetch('https://api.mcsrvstat.us/2/meepcraft.com');
    const j = await r.json() as IMCOnline | IMCOffline;

    return { playersOnline: j.online ? j.players.online : 0 };
}

const cache = {
    time: -1,
    players: 0
}

export default class extends Command {
    constructor() {
        super(
            [ 
                'Get the number of users playing MeepCraft right now.',
                ''
            ],
			{
                name: 'meepcraft',
                folder: 'Fun',
                aliases: [ 'meep' ],
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        if(cache.time !== -1 && (Date.now() - cache.time) / 1000 / 60 < 5) {
            const sentence = cache.players ? 'is ``1`` player' : `are \`\`${cache.players}\`\` players`;
            const embed = this.Embed.success(`There ${sentence} on Meepcraft right now!`);
            return message.reply(embed);
        }

        let players;
        try {
            players = await fetchMeepOnline();
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server failed to process the request!'));
            }

            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        cache.time = Date.now();
        cache.players = players.playersOnline;

        const sentence = cache.players ? 'is ``1`` player' : `are \`\`${cache.players}\`\` players`;
        const embed = this.Embed.success(`There ${sentence} on Meepcraft right now!`);
        return message.reply(embed);
    }
}