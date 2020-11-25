import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Remove active warning points.',
                '1', '5'
            ],
			{
                name: 'unwarn',
                folder: 'Moderation',
                args: [2, 2],
                aliases: [ 'deletewarn', 'removewarn' ],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.KICK_MEMBERS ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const idOrUser = getMentions(message, args);
        if(!isValidNumber(+args[1], { allowNegative: false }) || +args[1] === 0) {
            return message.reply(this.Embed.fail(`
            Invalid number of points given.

            To remove warnings, use \`\`clearwarning\`\` (\`\`help clearwarning\`\` for example usage).
            `));
        } else if(!idOrUser || (typeof idOrUser === 'string' && !validSnowflake(idOrUser))) {
            return message.reply(this.Embed.fail('Invalid user ID!'));
        }

        const member = typeof idOrUser === 'string' ? idOrUser : idOrUser.id;
        const points = Number(args[1]);

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

        return message.reply(this.Embed.success(`
        Removed ${points} active warning points from ${idOrUser}!
        `));
    }
}