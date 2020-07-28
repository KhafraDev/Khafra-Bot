import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
// @ts-ignore
import { agent } from '../../Backend/Helpers/Proxy';
import fetch from 'node-fetch';
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            'meepcraft',
            [ 
                'Get the number of users playing MeepCraft right now.',
                ''
            ],
            [ /* No extra perms needed */ ],
            60
        );
    }

    async init(message: Message) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        }

        const players = await this.fetch();
        if(players === null) {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }

        const embed = Embed.success(`There are \`\`${players.playersOnline}\`\` players on Meepcraft right now!`);
        return message.channel.send(embed);
    }

    async fetch() {
        try {
            const res = await fetch('https://forum.meepcraft.com/game/query.php', {
                agent
            });

            const json = await res.json();
            return json;
        } catch(e) {
            console.log(e);
            return null;
        }
    }
}