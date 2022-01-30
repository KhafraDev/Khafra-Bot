import { client } from '#khaf/Client';
import { sql } from '#khaf/database/Postgres.js';
import { logger } from '#khaf/Logger';
import { Timer } from '#khaf/Timer';
import { Giveaway } from '#khaf/types/KhafraBot.js';
import { isText } from '#khaf/utility/Discord.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import { User } from 'discord.js';
import { setInterval } from 'timers';

export class GiveawayTimer extends Timer {
    constructor () {
        super({ interval: 30 * 1000 });
    }

    setInterval (): NodeJS.Timer {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const interval = setInterval(async () => {
            const rows = await sql<Giveaway[]>`
                DELETE FROM kbGiveaways 
                WHERE kbGiveaways.endDate < CURRENT_TIMESTAMP
                RETURNING *;
            `;

            for (const row of rows) {
                void this.action(row);
            }
        }, this.options.interval);

        return interval;
    }

    async action (giveaway: Giveaway): Promise<void> {
        try {
            const guild = await client.guilds.fetch(giveaway.guildid);
            const channel = 
                guild.channels.cache.get(giveaway.channelid) ??
                await client.channels.fetch(giveaway.channelid);
    
            if (!hasPerms(channel, guild.me, PermissionFlagsBits.ReadMessageHistory)) return;
            if (!isText(channel)) return;
            if (!client.user) return;
    
            const message = await channel.messages.fetch(giveaway.messageid);
            const reactions = message.reactions.cache;
    
            if (message.author.id !== client.user.id) return;
            if (!reactions.has('🎉')) {
                const emoji = message.reactions.resolve('🎉');
    
                if (emoji) {
                    await emoji.users.fetch();
                }
            }
    
            const { users, count } = reactions.get('🎉')!;
            if (users.cache.size !== count) {
                await users.fetch();
            }
    
            const winners: User[] = [];
            if (count > giveaway.winners) { // bot react counts so the length must be greater
                while (winners.length < giveaway.winners) {
                    const random = users.cache.random();
                    if (!random) break;
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
            logger.error(e);
        }
    }
}