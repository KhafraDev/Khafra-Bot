import { pool } from '../../../Structures/Database/Postgres.js';
import { Giveaway } from '../../types/KhafraBot.js';
import { client } from '../../../index.js';
import { isText } from '../../types/Discord.js.js';
import { EventEmitter } from 'events';

interface GiveawayEmitter extends EventEmitter {
    on(event: 'giveaway', listener: (giveaway: Giveaway) => void): this;
    emit(event: 'giveaway', giveaway: Giveaway): boolean
}

const Giveaways: GiveawayEmitter = new EventEmitter();

setInterval(async () => {
    const { rows } = await pool.query<Giveaway>(`
        DELETE FROM kbGiveaways 
        WHERE kbGiveaways.endDate < CURRENT_TIMESTAMP::time
        RETURNING *;
    `);

    for (const row of rows)
        Giveaways.emit('giveaway', row);
}, 30 * 1000);

Giveaways.on('giveaway', async (giveaway) => {
    try {
        const channel = await client.channels.fetch(giveaway.channelid);
        if (!isText(channel)) return;

        const message = await channel.messages.fetch(giveaway.messageid);
        const reactions = message.reactions.cache;

        if (message.author.id !== client.user.id) return;
        if (!reactions.has('🎉')) return;

        console.log(reactions.get('🎉').users);
    } catch (e) {
        console.log(e);
    }
});