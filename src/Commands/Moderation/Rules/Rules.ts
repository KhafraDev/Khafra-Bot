import { Command } from '../../../Structures/Command.js';
import { 
    Message, 
    TextChannel, 
    NewsChannel 
} from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { isText } from '../../../lib/types/Discord.js.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Set the rules to the server.',
                ''
            ],
			{
                name: 'rules',
                aliases: [ 'setrules', 'rule', 'ruleboard', 'rulesboard' ],
                folder: 'Rules',
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if((!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id))
            || args.length === 1
        ) {
            const num = +args[0];
            const rule = settings?.rules?.rules?.filter(r => r.index === num).shift();
            if(!isValidNumber(+args[0]) || !rule) {
                return message.reply(this.Embed.fail(
                    args.length === 1
                    ? `Rule #${args[0]} doesn't exist!`
                    : `You don't have permission to add rules!`
                ));
            }

            return message.reply(this.Embed.success(rule.rule).setTitle(`Rule ${rule.index}`));
        } else if(settings && 'rules' in settings && settings.rules.rules?.length > 0) {
            return message.reply(this.Embed.fail(`
            Rules already exist in this guild!

            Use \`\`clearrules\`\` (\`\`help clearrules\`\` for examples) to remove all rules.
            Use \`\`addrule\`\` (\`\`help addrule\`\` for examples) to add a rule.
            `));
        }

        const msg = await message.reply(this.Embed.success(`
        **Rule Board:**
        Steps:
            1. Enter the channel or channel id to post the rules to (once reading this).
            2. Enter the rules one at a time.
            3. Once all the rules are entered, post \`\`stop\`\`.
            4. To post the rules, use the \`\`postrules\`\` command (\`\`help postrules\`\` for examples).
            5. To edit a rule, use the \`\`editrule\`\` command (\`\`help editrule\`\` for examples).
            6. To remove a rule, use the \`\`deleterule\`\` command (\`\`help deleterule\`\` for examples).

        Make sure the rules are already written down - you will have 5 minutes to enter all of them.
        `));
        if(!msg) return;
        let channel: TextChannel | NewsChannel | undefined;
        let i = 1;
        const rules: { index: number, rule: string }[] = [];

        const collector = message.channel.createMessageCollector(
            (m: Message) => 
                m.author.id === message.author.id
                && (!channel ? validSnowflake(m.content) : true)
                && rules.length < 20, // can add more later
            { time: 60 * 1000 * 5 }
        );
        collector.on('collect', (m: Message) => {
            if(!msg || msg?.deleted) {
                return collector.stop();
            } else if(m.content.toLowerCase() === 'stop') {
                return collector.stop('1');
            }

            if(!channel) {
                const mention = getMentions(m, m.content.split(/\s+/g), { type: 'channels' });
                if(!mention) return;
                if(typeof mention === 'string' && message.guild.channels.cache.has(mention)) {
                    const guildChannel = message.guild.channels.cache.get(mention);
                    if(!isText(guildChannel)) return;
                    channel = guildChannel;
                } else if(mention instanceof NewsChannel || mention instanceof TextChannel) {
                    channel = mention;
                }

                if(!channel) return;
                return msg.edit(this.Embed.success(`
                **Rule Board:** ${channel}
                The first step is now done, continue to enter rules until all of them have been posted in order.
                Once you're done posting all of them, post \`\`stop\`\` (if you forget, all of the rules will be discarded).

                The bot will automatically post the rule number in order of the messages so you do not need to include them.
                `));
            }

            rules.push({ index: i++, rule: m.content });
        });
        collector.on('end', async (_, r) => {
            if(!msg) return;
            if(r === '1') { // stopped by user
                const client = await pool.settings.connect();
                const collection = client.db('khafrabot').collection('settings');
                await collection.updateOne(
                    { id: message.guild.id },
                    { $set: {
                        rules: { channel: channel.id, rules }
                    } },
                    { upsert: true }
                );

                return msg.edit(this.Embed.success(`
                Added ${rules.length} rules!

                To post the rules, use the \`\`postrules\`\` command (\`\`help postrules\`\` for examples).
                To edit a rule, use the \`\`editrule\`\` command (\`\`help editrule\`\` for examples).
                To remove a rule, use the \`\`deleterule\`\` command (\`\`help deleterule\`\` for examples).
                `));
            }
        });
    }
}