import { pool } from '../../../Structures/Database/Postgres.js';
import { Giveaway } from '../../types/KhafraBot.js';
import { client } from '../../../index.js';
import { isText } from '../../types/Discord.js.js';
import { EventEmitter } from 'events';
import { User } from 'discord.js';

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

        const { users, count } = reactions.get('🎉');
        if (users.cache.size !== count) {
            await users.fetch();
        }

        const winners: User[] = [];
        if (count > giveaway.winners) { // bot react counts so the length must be greater
            while (winners.length < giveaway.winners) {
                const random = users.cache.random();
                if (random.bot) continue;
                if (winners.some(u => u.id === random.id)) continue;

                winners.push(random);
            }
        } else if (count === 1 && users.cache.first().id === client.user.id) { // no one entered
            if (message.editable) {
                return message.edit({
                    content: 'No one entered the giveaway!'
                });
            } else {
                return message.channel.send({
                    content: 'No one entered the giveaway!'
                });
            }
        } else if (count <= giveaway.winners) { // less entered than number of winners
            for (const [, user] of users.cache) {
                if (user.bot) continue;
                winners.push(user);
            }
        }

        if (!message.editable) {
            if (giveaway.winners !== 1 && winners.length > 1) {
                return message.channel.send({
                    content: `Giveaway ended! The winners are ${winners.join(', ')}! 🎉`
                });
            } else {
                return message.channel.send({
                    content: `Giveaway ended! The winner is ${winners}! 🎉`
                });
            }
        } else {
            if (giveaway.winners !== 1 && winners.length > 1) {
                return message.edit({
                    content: `Giveaway has ended, the winners are ${winners.join(', ')}! 🎉`
                });
            } else {
                return message.edit({
                    content: `Giveaway has ended, the winner is ${winners}! 🎉`
                });
            }
        }
    } catch (e) {
        console.log(e);
    }
});