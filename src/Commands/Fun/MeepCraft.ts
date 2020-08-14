import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { agent } from '../../lib/Utility/Proxy';
import fetch from 'node-fetch';
import Embed from "../../Structures/Embed";

const latest = {
    fetched: 0,
    results: -1,
}

export default class extends Command {
    constructor() {
        super(
            { name: 'meepcraft', folder: 'Fun' },
            [ 
                'Get the number of users playing MeepCraft right now.',
                ''
            ],
            [ /* No extra perms needed */ ],
            10
        );
    }

    async init(message: Message) {
        if(latest.results !== -1 && ((Date.now() - latest.fetched) / 1000 / 60) < 5) {
            const sentence = `There ${latest.results === 1 ? 'is ``1`` player': 'are ``' + latest.results + '`` players'}`
            const embed = Embed.success(`${sentence} on Meepcraft right now!`)
                .setTimestamp(latest.fetched)
                .setFooter('Last checked at');

            return message.channel.send(embed);
        }
        
        let players: { playersOnline: number };
        try {
            const res = await fetch('https://forum.meepcraft.com/game/query.php', {
                agent
            });

            players = await res.json();
        } catch {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }

        latest.fetched = Date.now();
        latest.results = players.playersOnline;

        const sentence = `There ${players.playersOnline === 1 ? 'is ``1`` player': 'are ``' + players.playersOnline + '`` players'}`
        const embed = Embed.success(`${sentence} on Meepcraft right now!`);
        return message.channel.send(embed);
    }
}