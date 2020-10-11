import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';
import ms from 'ms';

export default class extends Command {
    constructor() {
        super(
            [
                'Ban a member from the guild.',
                '@user 3d for a good reason',
                '@user 0 bye!',
                '239566240987742220 7d'
            ],
            [ 'BAN_MEMBERS' ],
            {
                name: 'ban', 
                folder: 'Moderation',
                aliases: [ 'bna' ],
                args: [1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.Embed.missing_perms.call(this));
        }

        const id = !isNaN(+args[0]) 
            ? args[0]
            : message.mentions.users.filter(u => u.id !== message.guild.me.id).first()?.id;
        const clear = Math.round((ms(args[1] ?? '7d') ?? ms('7d')) / 86400000); // defaults to 7d worth of messages clearing

        if(!id) {
            return message.channel.send(this.Embed.generic(
                'Invalid user mentioned or ID provided in the first argument!'
            ));
        }

        try {
            await message.guild.members.ban(id, {
                days: parseInt(clear.toString()),
                reason: args.slice(ms(args[1]) ? 2 : 1).join(' ')
            });
        } catch {
            return message.channel.send(this.Embed.fail(`${id} isn't bannable!`));
        }

        return message.channel.send(this.Embed.success(`
        ${id} has been banned from the guild and ${clear} days worth of messages have been removed.
        `));
    }
}