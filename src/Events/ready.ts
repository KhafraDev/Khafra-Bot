import { Event } from '../Structures/Event.js';
import { MessageEmbed, Snowflake } from 'discord.js';
import { formatDate } from '../lib/Utility/Date.js';
import { client } from '../index.js';
import config from '../../config.json';
import { RegisterEvent } from '../Structures/Decorator.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'ready' as const;

    async init() {
        const s = `Logged in at ${formatDate('MMMM Do, YYYY hh:mm:ssA', new Date())}`;
        console.log(s);
        
        if (typeof config.botOwner === 'string') {
            try {
                const user = await client.users.fetch(config.botOwner as Snowflake);
                await user.send({ 
                    embeds: [
                        new MessageEmbed()
                            .setDescription(s)
                            .setColor(config.embed.success as `#${string}`)
                    ]
                }); 
            } catch {
                console.log(`Logged in! Could not send message to the bot owner.`);
            }
        }

        void client.loadInteractions();
    }
}