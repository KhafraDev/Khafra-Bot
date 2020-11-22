import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { FindAndModifyWriteOpResultObject } from 'mongodb';
import { Warnings } from '../../../lib/types/Collections.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Set the amount of warning points it requires before a member is kicked.',
                '100',
                '20 [default is 20]'
            ],
            [ /* No extra perms needed */ ],
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
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } else if(!isValidNumber(Number(args[0]))) {
            return message.reply(this.Embed.generic('Invalid **number** set for number of warning points!'));
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

        return message.reply(this.Embed.success(`
        Changed the warning limit! It was ${old} points (0 being not added) and it is now ${args[0]} points.
        `));
    }
}