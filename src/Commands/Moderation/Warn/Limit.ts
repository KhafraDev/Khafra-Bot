import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { FindAndModifyWriteOpResultObject } from 'mongodb';
import { Warnings } from '../../../lib/types/Collections.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the amount of warning points it requires before a member is kicked.',
                '100',
                '20 [default is 20]'
            ],
			{
                name: 'warnlimit',
                aliases: [ 'limit', 'setwarn' ],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } else if (!isValidNumber(Number(args[0]))) {
            return this.Embed.generic(this, 'Invalid **number** set for number of warning points!');
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');
        const warns = await collection.findOneAndUpdate(
            { id: message.guild.id },
            {
                $set: {
                    limit: Number(args[0])
                }
            },
            { returnOriginal: true, upsert: true }
        ) as FindAndModifyWriteOpResultObject<Warnings>;

        const old = warns.value?.limit ?? 0;
        return this.Embed.success(`
        Changed the warning limit! It was ${old} points (0 being not added) and it is now ${args[0]} points.
        `);
    }
}