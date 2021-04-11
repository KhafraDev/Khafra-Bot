import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { Warnings, GuildSettings } from '../../../lib/types/Collections.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms, hierarchy } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Warn someone for breaking a rule.',
                '@user 5 for trolling',
                '1234567891234567 5'
            ],
			{
                name: 'warn',
                folder: 'Moderation',
                args: [2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.KICK_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: GuildSettings) {
        if (!isValidNumber(+args[1], { allowNegative: false }) || +args[1] === 0) {
            return this.Embed.fail(`
            Invalid number of points given.

            To remove warnings, use \`\`clearwarning\`\` (\`\`help clearwarning\`\` for example usage).
            `);
        } 

        const member = await getMentions(message, 'members');
        if (!member) {
            return this.Embed.fail('No member was mentioned and/or an invalid ❄️ was used!');
        } else if (!member.kickable) {
            return this.Embed.fail(`I can't warn someone I don't have permission to kick!`);
        } else if (!hierarchy(message.member, member)) {
            return this.Embed.fail(`You cannot warn ${member}!`);
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');
        const warns = await collection.findOne<Warnings>({ 
            id: message.guild.id 
        });

        const user = warns?.users?.[member.id];
        const active = (user?.active ?? 0) + Number(args[1]);
        const limit = (warns?.limit ?? 20);

        const shouldKick = active >= limit;

        /** Points now active for user */
        const nowActive = active % limit;
        /** Points now inactive for user */
        const nowInactive = shouldKick
            ? active - nowActive
            : (user?.inactive ?? 0);

        if (!warns) {
            await collection.insertOne({
                id: message.guild.id,
                limit: 20,
                users: {
                    [member.id]: {
                        active: nowActive,
                        inactive: (user?.inactive ?? 0) + nowInactive,
                        warns: [{
                            reason: args.slice(2).join(' '),
                            points: Number(args[1])
                        }]
                    }
                }
            });
        } else { // collection for guild does exist
            const w = (user?.warns ?? []).concat({ reason: args.slice(2).join(' '), points: Number(args[1]) });
            await collection.updateOne(
                { id: message.guild.id },
                {
                    $set: {
                        [`users.${member.id}`]: {
                            active: nowActive,
                            inactive: (user?.inactive ?? 0) + nowInactive,
                            warns: w
                        }
                    }
                }
            );
        }

        if (shouldKick) {
            try {
                await member.kick(`Khafra-Bot: exceeded warning limit; kicked automatically.`);
            } catch {
                return this.Embed.fail(`Couldn't kick ${member}.`);
            }

            return this.Embed.success(`
            ${member} was automatically kicked from the server for reaching ${limit} warning points.
            `);
        } else {
            await message.reply(this.Embed.success(`
            Gave ${member} ${Number(args[1])} warning points.
            `));
        }

        if (typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel);
            if (!isText(channel) || !hasPerms(channel, message.guild.me, [ 'SEND_MESSAGES', 'EMBED_LINKS' ])) {
                return;
            }

            const reason = args.slice(2).join(' ');
            return channel.send(this.Embed.success(`
            **Offender:** ${member}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            **Points:** ${args[1]} warning points given.
            **Kicked:** ${shouldKick ? 'Yes' : 'No'} (${active}/${limit} total points).
            `).setTitle('Member Warned'));
        }
    }
}