import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { Warnings } from "../../lib/types/Collections";

export default class extends Command {
    constructor() {
        super(
            [
                'Get a user\'s warnings!',
                '@user#0001', '387651929511165952', ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'getwarns',
                folder: 'Moderation',
                cooldown: 5,
                aliases: [ 'getwarn', 'getwarning', 'getwarnings' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        let fetchedMember = message.mentions.members.first();
        // if you don't have perms you can only retrieve your own records
        if(!super.hasPermissions(message, null, [ 'KICK_MEMBERS' ]) || args.length === 0) {
            fetchedMember = message.member;
        } else if(!fetchedMember) {
            try {
                fetchedMember = await message.guild.members.fetch(args[0]);
            } catch {
                fetchedMember = message.member;
            }
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');

        const result = await collection.findOne({ id: message.guild.id }) as Warnings;
        if(!result) {
            return message.channel.send(Embed.fail('No user\'s have been warned!'));
        }

        if(!(fetchedMember.id in result.users)) {
            return message.channel.send(Embed.success(`
            ${fetchedMember} has no warnings!
            `));
        } else {
            const user = result.users[fetchedMember.id];
            const embed = Embed.success()
                .setDescription(`
                ${fetchedMember} warnings:
                Total active points: ${user.points % (result.limit ?? 20)} (${result.limit ?? '20'} is an automatic kick).
                ${(user.reasons as { points: number, message: string }[]).map(r => `${r.points} Points: \`\`${r.message.slice(0, 99)}\`\``)}
                `);

            if(embed.description.length > 2048) {
                // max length = 2048 or error
                embed.description = embed.description.slice(0, 2048);
                // remove incomplete line
                embed.description = embed.description.split('\n').slice(0, -1).join('\n');
            }

            return message.channel.send(embed);
        }
    }
}