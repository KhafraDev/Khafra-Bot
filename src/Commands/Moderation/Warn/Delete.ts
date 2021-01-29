import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Remove active warning points.',
                '@GoodPerson#0001 1', '379675571451592706 5'
            ],
			{
                name: 'unwarn',
                folder: 'Moderation',
                args: [2, 2],
                aliases: [ 'deletewarn', 'removewarn', 'clearwarning' ],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.KICK_MEMBERS ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        const member = await getMentions(message, 'members');
        const points = Number(args[1]);

        if (!member) {
            return message.reply(this.Embed.fail('No member was mentioned and/or an invalid ❄️ was used!'));
        } else if (!isValidNumber(points, { allowNegative: false }) || points === 0) {
            return message.reply(this.Embed.fail('You\'re trying to remove an invalid number of points!'));
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');
        const found = await collection.findOneAndUpdate(
            {
                id: message.guild.id,
                [`users.${member}.active`]: { $gte: points }
            },
            {
                $inc: {
                    [`users.${member}.active`]: points * -1,
                    [`users.${member}.inactive`]: points
                }
            }
        );

        if(!found.lastErrorObject?.updatedExisting || found.value === null) {
            return message.reply(this.Embed.fail(`
            User doesn't have enough active warning points to have ${points} removed from them.
            `));
        }

        await message.reply(this.Embed.success(`
        Removed ${points} active warning points from ${member}!
        `));

        if(typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel);
            if(!isText(channel)) {
                return;
            } else if(!channel.permissionsFor(message.guild.me).has([ 'SEND_MESSAGES', 'EMBED_LINKS' ])) {
                return;
            }

            return channel.send(this.Embed.success(`
            **User:** ${member}
            **Staff:** ${message.member}
            **Removed:** ${points} active warning points.
            `).setTitle('Removed Active Warnings'));
        }
    }
}