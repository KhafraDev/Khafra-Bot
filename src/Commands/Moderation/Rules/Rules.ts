import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { Range } from '../../../lib/Utility/Range.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';

const range = Range(0, 32767, true); // smallint

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the rules to the server, or get a rule with a known id.',
                '', '69'
            ],
			{
                name: 'rules',
                aliases: [ 'setrules', 'rule', 'ruleboard', 'rulesboard' ],
                folder: 'Rules',
                args: [0, 1],
                guildOnly: true,
                ratelimit: 60 * 1000 * 5
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        if ( // get existing rule with a given id
            !hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR) || 
            args.length === 1
        ) {
            if (args.length === 0)
                return this.Embed.fail(`You can't set the rules, so you have to provide a rule id to view.`);

            const id = Number(args[0]);
            if (!validateNumber(id) || !range.isInRange(id))
                return this.Embed.fail(`Try giving me an actual rule id this time.`);

            const { rows } = await pool.query<{ rule: string }>(`
                SELECT rule FROM kbRules
                WHERE 
                    rule_id = $1::smallint AND
                    k_guild_id = $2::text
                LIMIT 1;
            `, [id, message.guild.id]);

            if (rows.length === 0)
                return this.Embed.fail(`No rule with that ID was found.`);

            return this.Embed.success(`\`\`\`${rows[0].rule}\`\`\``)
                .setTitle(`Rule #${id}`);
        }

        const msg = await message.reply({ embeds: [this.Embed.success(`
        **Rule Board:**
        Steps:
            1. Enter the rules one at a time.
            2. Once all the rules are entered, send a \`\`stop\`\` message.
            3. Set a channel to post the rules to using the \`\`channel\`\` command!

            - To post the rules, use the \`\`postrules\`\` command (\`\`help postrules\`\` for examples).
            - To edit a rule, use the \`\`editrule\`\` command (\`\`help editrule\`\` for examples).
            - To remove a rule, use the \`\`deleterule\`\` command (\`\`help deleterule\`\` for examples).

        Make sure the rules are already written down - you have 5 minutes to enter all of them.
        `)] });
        
        const rules = new Set<string>();
        const collector = message.channel.createMessageCollector({
            filter: (m) => m.author.id === message.author.id && rules.size <= 20,
            time: 60 * 1000 * 5 
        });

        collector.on('collect', async (m) => {
            if (msg?.deleted)
                return collector.stop();
            else if (m.content.toLowerCase() === 'stop')
                return collector.stop('1');
            else if (rules.size === 20)
                return collector.stop('1');

            rules.add(m.content);
        });

        collector.on('end', async (_collection, reason) => {
            if (reason === '1') { // stopped by user
                // TODO(@KhafraDev): rewrite this
                // https://node-postgres.com/features/transactions
                const client = await pool.connect();

                try {
                    await client.query('BEGIN');

                    for (const rule of rules) {
                        await client.query(`
                            INSERT INTO kbRules (
                                k_guild_id, 
                                rule, 
                                rule_id
                            ) VALUES (
                                $1::text, 
                                $2::text, 
                                (SELECT COUNT(kbRules.id) FROM kbRules WHERE kbRules.k_guild_id = $1::text) + 1
                            ) ON CONFLICT DO NOTHING;
                        `, [message.guild.id, rule]);
                    }

                    await client.query('COMMIT');
                } catch {
                    await client.query('ROLLBACK');
                } finally {
                    client.release();
                }

                return void dontThrow(msg.edit({ 
                    embeds: [this.Embed.success(`
                    Added ${rules.size} rules!

                    To post the rules, use the \`\`postrules\`\` command (\`\`help postrules\`\` for examples).
                    To edit a rule, use the \`\`editrule\`\` command (\`\`help editrule\`\` for examples).
                    To remove a rule, use the \`\`deleterule\`\` command (\`\`help deleterule\`\` for examples).
                    `)]
                }));
            }
        });
    }
}