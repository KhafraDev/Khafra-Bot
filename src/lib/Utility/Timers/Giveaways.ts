import { pool } from '../../../Structures/Database/Postgres.js';
import { Giveaway } from '../../types/KhafraBot.js';
import { client } from '../../../index.js';
import { isText } from '../../types/Discord.js.js';
import { EventEmitter } from 'events';
import { Permissions, User } from 'discord.js';
import { hasPerms } from '../Permissions.js';

interface GiveawayEmitter extends EventEmitter {
    on(event: 'giveaway', listener: (giveaway: Giveaway) => void | Promise<void>): this;
    emit(event: 'giveaway', giveaway: Giveaway): boolean
}

const Giveaways: GiveawayEmitter = new EventEmitter();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
setInterval(async () => {
    const { rows } = await pool.query<Giveaway>(`
        DELETE FROM kbGiveaways 
        WHERE kbGiveaways.endDate < CURRENT_TIMESTAMP
        RETURNING *;
    `);

    for (const row of rows)
        Giveaways.emit('giveaway', row);
}, 30 * 1000).unref();

Giveaways.on('giveaway', async (giveaway) => {
    try {
        const guild = await client.guilds.fetch(giveaway.guildid);
        const channel = 
            guild.channels.cache.get(giveaway.channelid) ??
            await client.channels.fetch(giveaway.channelid);

        if (!hasPerms(channel, guild.me, Permissions.FLAGS.READ_MESSAGE_HISTORY)) return;
        if (!isText(channel)) return;
        if (!client.user) return;

        const message = await channel.messages.fetch(giveaway.messageid);
        const reactions = message.reactions.cache;

        if (message.author.id !== client.user.id) return;
        if (!reactions.has('🎉')) return;

        const { users, count } = reactions.get('🎉')!;
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
        } else if (count === 1 && users.cache.first()!.id === client.user.id) { // no one entered
            if (message.editable) {
                return void message.edit({
                    content: 'No one entered the giveaway!'
                });
            } else {
                return void message.channel.send({
                    content: 'No one entered the giveaway!'
                });
            }
        } else if (count <= giveaway.winners) { // less entered than number of winners
            for (const user of users.cache.values()) {
                if (user.bot) continue;
                winners.push(user);
            }
        }

        if (!message.editable) {
            if (giveaway.winners !== 1 && winners.length > 1) {
                return void message.channel.send({
                    content: `Giveaway ended! The winners are ${winners.join(', ')}! 🎉`
                });
            } else {
                return void message.channel.send({
                    content: `Giveaway ended! The winner is ${winners}! 🎉`
                });
            }
        } else {
            if (giveaway.winners !== 1 && winners.length > 1) {
                return void message.edit({
                    content: `Giveaway has ended, the winners are ${winners.join(', ')}! 🎉`
                });
            } else {
                return void message.edit({
                    content: `Giveaway has ended, the winner is ${winners}! 🎉`
                });
            }
        }
    } catch (e) {
        console.log(e);
    }
});