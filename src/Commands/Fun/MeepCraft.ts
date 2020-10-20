import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { agent } from '../../lib/Utility/Proxy.js';
import fetch from 'node-fetch';
import { Agent } from "https";
import AbortController from 'node-abort-controller';
import { AbortSignal } from "node-fetch/externals";

const latest = {
    fetched: 0,
    results: -1,
}

export default class extends Command {
    constructor() {
        super(
            [ 
                'Get the number of users playing MeepCraft right now.',
                ''
            ],
            [ /* No extra perms needed */ ],
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

            return message.channel.send(embed);
        }
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        let players: { playersOnline: number };
        try {
            const res = await fetch('https://forum.meepcraft.com/game/query.php', {
                // Love when the only available package for proxying connections
                // hasn't been properly updated in years. 
                // https://github.com/TooTallNate/node-https-proxy-agent/issues/108
                agent: agent as unknown as Agent,
                signal: controller.signal as AbortSignal
            });
            players = await res.json();
        } catch(e) {
            if(controller.signal.aborted === true) {
                return message.channel.send(this.Embed.fail(`
                Request was aborted. Likely caused by the proxy which is being used currently.
                `));
            }

            this.logger.log(e);
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }

        clearTimeout(timeout); // so it doesn't abort after the request succeeded!
        latest.fetched = Date.now();
        latest.results = players.playersOnline;

        const sentence = `There ${players.playersOnline === 1 ? 'is ``1`` player': 'are ``' + players.playersOnline + '`` players'}`
        const embed = this.Embed.success(`${sentence} on Meepcraft right now!`);
        return message.channel.send(embed);
    }
}