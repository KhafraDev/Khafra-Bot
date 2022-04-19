import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { inlineCode } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';
import { request } from 'undici';

interface IMCOnline {
    online: true
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
	map: string
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

const fetchMeepOnline = async (): Promise<{ playersOnline: number }> => {
    const { body } = await request('https://api.mcsrvstat.us/2/meepcraft.com');
    const j = await body.json() as IMCOnline | IMCOffline;

    return { playersOnline: j.online ? j.players.online : 0 };
}

const cache = {
    time: -1,
    players: 0
}

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get the number of users playing MeepCraft right now.'
            ],
            {
                name: 'meepcraft',
                folder: 'Fun',
                aliases: ['meep'],
                args: [0, 0]
            }
        );
    }

    async init (): Promise<APIEmbed> {
        if (cache.time !== -1 && (Date.now() - cache.time) / 1000 / 60 < 5) {
            const sentence = cache.players === 1
                ? 'is ``1`` player'
                : `are ${inlineCode(`${cache.players}`)} players`;
            return Embed.ok(`There ${sentence} on Meepcraft right now!`);
        }

        const players = await fetchMeepOnline();

        cache.time = Date.now();
        cache.players = players.playersOnline;

        const sentence = cache.players === 1
            ? 'is ``1`` player'
            : `are ${inlineCode(`${cache.players}`)} players`;
        return Embed.ok(`There ${sentence} on Meepcraft right now!`);
    }
}