import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { request } from 'http';
import { get, RequestOptions } from 'https';

const auth = 'Basic ' + Buffer.from(
    process.env.PROXY_USERNAME + ':' + process.env.PROXY_PASSWORD
).toString('base64');

const latest = {
    fetched: 0,
    results: -1,
}

/** 
 * (Mostly) Stolen from
 * @see https://stackoverflow.com/a/49611762
 */
const fetchMeepOnline = () => {
    return new Promise<string>((res, rej) => {
        request({
            host: 'us5042.nordvpn.com',         // IP address of proxy server
            port: 80,                           // port of proxy server
            method: 'CONNECT',
            path: 'forum.meepcraft.com:443',    // some destination, add 443 port for https!
            headers: {
                'Proxy-Authorization': auth
            },
        })
        .on('connect', (resp, socket) => {
            if(resp.statusCode === 200) {        // connected to proxy server
                const req = get({
                    host: 'forum.meepcraft.com',
                    socket: socket,             // using a tunnel
                    agent: false,      
                    path: '/game/query.php'     // specify path to get from server
                } as RequestOptions, resp => {
                    const chunks = Array<Uint8Array>();
                    resp.on('data', c => chunks.push(c));
                    resp.on('end', () => res(Buffer.concat(chunks).toString('utf-8')));
                });

                setTimeout(() => {
                    req.abort();
                    rej('Request aborted!');
                }, 30000);
            }
        })
        .on('error', rej)
        .end();
    });
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
        if(latest.results !== -1 && ((Date.now() - latest.fetched) / 1000 / 60) < 5) {
            const sentence = `There ${latest.results === 1 ? 'is ``1`` player': 'are ``' + latest.results + '`` players'}`
            const embed = this.Embed.success(`${sentence} on Meepcraft right now!`)
                .setTimestamp(latest.fetched)
                .setFooter('Last checked at');

            return message.reply(embed);
        }

        let players: { playersOnline: number };
        try {
            const res = await fetchMeepOnline();
            players = JSON.parse(res);
        } catch(e) {
            this.logger.log(e);
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        latest.fetched = Date.now();
        latest.results = players.playersOnline;

        const sentence = `There ${players.playersOnline === 1 ? 'is ``1`` player': 'are ``' + players.playersOnline + '`` players'}`
        const embed = this.Embed.success(`${sentence} on Meepcraft right now!`);
        return message.reply(embed);
    }
}