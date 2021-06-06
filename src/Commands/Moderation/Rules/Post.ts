import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { chunkSafe } from '../../../lib/Utility/Array.js';

const perms = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.READ_MESSAGE_HISTORY,
    Permissions.FLAGS.MANAGE_CHANNELS
]);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the rules to the server.'
            ],
			{
                name: 'post',
                aliases: [ 'postrules', 'postrule' ],
                folder: 'Rules',
                args: [0, 0],
                guildOnly: true,
                ratelimit: 60
            }
        );
    }

    async init(message: Message, _args: Arguments) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);

        const { rows } = await pool.query<{ rules_channel: `${bigint}` | null, rule: string }>(`
            SELECT rules_channel, rule FROM kbGuild
            INNER JOIN kbRules ON kbGuild.guild_id = kbRules.k_guild_id
            WHERE kbGuild.guild_id = $1::text;
        `, [message.guild.id]);

        if (rows[0].rules_channel === null) // rule channel not set
            return this.Embed.fail(`
            No \`rules\` channel set in this guild. 

            Add a channel using \`rulechannel\` before using this command! 🤗
            `);
        else if (!message.guild.channels.cache.has(rows[0].rules_channel)) // deleted, no access, etc.
            return this.Embed.fail(`
            Channel was deleted or I no longer have access to it. 😕

            Try changing the channel using the command \`rulechannel\`!
            `);

        const channel = message.guild.channels.cache.get(rows[0].rules_channel);

        if (!isText(channel)) // not possible but ts will not infer textchannel | newschannel, plus might as well be safe
            return this.Embed.fail('You did the impossible. Change the channel (\`rulechannel\`) please.');
        else if (!hasPerms(channel, message.guild.me, perms)) // doesn't have perms to post
            return this.Embed.fail('Give me permissions to read message history, embed links, manage channel, and send messages please!');

        await message.reply({ content: `Posting ${rows.length} rules to ${channel} now!` });
        
        const embeds = rows.map((rule, idx) => this.Embed.success(`${rule.rule}`).setTitle(`Rule #${idx+1}`));
        if (embeds.length === 1)
            return channel.send({ embed: embeds[0] });

        const groups = chunkSafe(embeds, 10); // max # of embeds 1 webhook msg can have
        const webhooks = await channel.fetchWebhooks(); // check for existing webhooks

        const webhook = webhooks.size === 0 
            ? await channel.createWebhook('Khafra-Bot Rules', { // no webhook, create one
                avatar: message.client.user.displayAvatarURL(),
                reason: 'posting rules'
              })
            : webhooks.find(wh => wh.type === 'Incoming'); // don't want channel following

        for (const group of groups)
            await webhook.send({ embeds: group });
    }
}