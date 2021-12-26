import { Event } from '#khaf/Event';
import { client } from '../index.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { validSnowflake } from '#khaf/utility/Mentions.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { join } from 'path';
import { yellow } from '#khaf/utility/Colors.js';

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));

export class kEvent extends Event<'ready'> {
    name = 'ready' as const;

    async init() {
        const s = `Logged in at ${new Date()}`;
        console.log(yellow(s));
        
        if (typeof config.botOwner === 'string') {
            if (!validSnowflake(config.botOwner)) {
                return console.log('Logged in, configuration bot owner is not a valid Snowflake!');
            }
            
            const user = await client.users.fetch(config.botOwner);
            const [err] = await dontThrow(user.send({ 
                embeds: [Embed.ok(s)]
            }));
        
            if (err !== null) {
                console.log(`Logged in! Could not send message to the bot owner.`);
            }
        }

        void client.loadInteractions();
    }
}