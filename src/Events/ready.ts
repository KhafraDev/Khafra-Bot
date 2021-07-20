import { Event } from '../Structures/Event.js';
import { formatDate } from '../lib/Utility/Date.js';
import { client } from '../index.js';
import config from '../../config.json';
import { RegisterEvent } from '../Structures/Decorator.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';
import { validSnowflake } from '../lib/Utility/Mentions.js';

@RegisterEvent
export class kEvent extends Event<'ready'> {
    name = 'ready' as const;

    async init() {
        const s = `Logged in at ${formatDate('MMMM Do, YYYY hh:mm:ssA', new Date())}`;
        console.log(s);
        
        if (typeof config.botOwner === 'string') {
            if (!validSnowflake(config.botOwner)) {
                return console.log('Logged in, configuration bot owner is not a valid Snowflake!');
            }
            
            const user = await client.users.fetch(config.botOwner);
            const [err] = await dontThrow(user.send({ 
                embeds: [Embed.success(s)]
            }));
        
            if (err !== null) {
                console.log(`Logged in! Could not send message to the bot owner.`);
            }
        }

        void client.loadInteractions();
    }
}