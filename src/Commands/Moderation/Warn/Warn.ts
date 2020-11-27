import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { Warnings, GuildSettings } from '../../../lib/types/Collections.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';
import { isText } from '../../../lib/types/Discord.js.js';

export default class extends Command {
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

    async init(message: Message, args: string[], settings: GuildSettings) {
        const idOrUser = getMentions(message, args);
        if(!isValidNumber(+args[1], { allowNegative: false }) || +args[1] === 0) {
            return message.reply(this.Embed.fail(`
            Invalid number of points given.

            To remove warnings, use \`\`clearwarning\`\` (\`\`help clearwarning\`\` for example usage).
            `));
        } else if(!idOrUser || (typeof idOrUser === 'string' && !validSnowflake(idOrUser))) {
            return message.reply(this.Embed.fail('Invalid user ID!'));
        }

        let member = message.guild.member(idOrUser) ?? message.guild.members.fetch(idOrUser);
        if(member instanceof Promise) {
            try {
                member = await member;
            } catch {
                return message.reply(this.Embed.fail(`
                ${member} couldn't be fetched!
                `));
            }
        }

        if(!member.kickable) {
            return message.reply(this.Embed.fail(`I can't warn someone I don't have permission to kick!`));
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

        if(!warns) {
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

        if(shouldKick) {
            try {
                await member.kick(`Khafra-Bot: exceeded warning limit; kicked automatically.`);
            } catch {
                return message.reply(this.Embed.fail(`Couldn't kick ${member}.`));
            }

            return message.reply(this.Embed.success(`
            ${member} was automatically kicked from the server for reaching ${limit} warning points.
            `));
        } else {
            await message.reply(this.Embed.success(`
            Gave ${member} ${Number(args[1])} warning points.
            `));
        }

        if(typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel);
            if(!isText(channel)) {
                return;
            } else if(!channel.permissionsFor(message.guild.me).has([ 'SEND_MESSAGES', 'EMBED_LINKS' ])) {
                return;
            }

            const reason = args.slice(2).join(' ');
            return channel.send(this.Embed.success(`
            **Offender:** ${idOrUser}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            **Points:** ${args[1]} warning points given.
            **Kicked:** ${shouldKick ? 'Yes' : 'No'} (${active}/${limit} total points).
            `).setTitle('Member Warned'));
        }
    }
}