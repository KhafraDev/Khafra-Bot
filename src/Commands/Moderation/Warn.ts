import { Command } from "../../Structures/Command";
import { Message, GuildMember } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { Warnings } from "../../lib/types/Collections";

export default class extends Command {
    constructor() {
        super(
            [
                'Warn a user!',
                '@user#0001 5 saying a bad word.',
                '239566240987742220 5 breaking a rule!'
            ],
            [ 'KICK_MEMBERS' ],
            {
                name: 'warn',
                folder: 'Moderation',
                args: [2],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 2) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        } else if(isNaN(+args[1])) {
            return message.channel.send(Embed.fail('Second argument must be a number!'));
        }

        let member: GuildMember = message.mentions.members.first();
        if(!member) {
            try {
                member = await message.guild.members.fetch(args[0]);
            } catch {
                return message.channel.send(Embed.fail(`
                A user must be mentioned or an ID provided. Warnings only work if the user is in the guild!
                `));
            }
        }

        if(!member.kickable) {
            return message.channel.send(Embed.fail(`I can't warn ${member}!`));
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');

        const updated = await collection.findOneAndUpdate(
            { id: message.guild.id },
            { 
                $inc: {
                    [`users.${member.id}.points`]: +args[1]
                },
                $push: {
                    [`users.${member.id}.reasons`]: {
                        points: +args[1],
                        message: args.slice(2).join(' ')
                    }
                }
            },
            { upsert: true, returnOriginal: false /* return updated document */ }
        );

        if(updated.ok === 1) {
            const memberWarnings = (updated.value as Warnings).users[member.id];
            const warningLimit = (updated.value as Warnings).limit ?? 20;

            if(memberWarnings.points >= warningLimit) {
                await member.kick(`Khafra-Bot: exceeded ${warningLimit} warning points.`);
                return message.channel.send(Embed.success(`
                ${member} reached ${warningLimit} warnings and they have been automatically kicked!
                `));
            } else {
                return message.channel.send(Embed.success(`
                ${member} was warned and given ${args[1]} points. 
                If they reach ${warningLimit} points they will be kicked! 
                They currently have ${memberWarnings.points} points.
                `));
            }
        }
    }
}