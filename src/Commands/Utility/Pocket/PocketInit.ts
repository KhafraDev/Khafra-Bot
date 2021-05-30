import { Command } from '../../../Structures/Command.js';
import { Message, MessageReaction, User, Permissions } from 'discord.js';
import { Pocket } from '@khaf/pocket';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Pocket: Start the process of authorizing your Pocket account.'
            ],
			{
                name: 'pocketinit',
                folder: 'Pocket',
                args: [0, 0],
                ratelimit: 300,
                permissions: [ Permissions.FLAGS.ADD_REACTIONS, Permissions.FLAGS.MANAGE_EMOJIS ]
            }
        );
    }

    async init(message: Message) {
        const pocket = new Pocket();
        pocket.redirect_uri = `https://discord.com/channels/${message.guild.id}/${message.channel.id}`;

        await pocket.requestCode();

        const embed = this.Embed.success(`
        Authorize Khafra-Bot using the link below! 
        
        [Click Here](${pocket.requestAuthorization})!
        After authorizing react with ✅ to confirm or ❌ to cancel. 
        
        **Command will be canceled after 2 minutes automatically.**
        `)
        .setTitle('Pocket');

        const msg = await message.reply(embed);
        await Promise.allSettled([msg.react('✅'), msg.react('❌')]);

        const filter = (reaction: MessageReaction, user: User) => 
            ['✅', '❌'].includes(reaction.emoji.name) && 
            user.id === message.author.id;
        const collector = msg.createReactionCollector(filter, { time: 120000, max: 1 });

        collector.on('collect', async r => {
            if (r.emoji.name === '❌') {
                return msg.edit(this.Embed.fail('Khafra-Bot wasn\'t authorized, command was canceled by user.'));
            }

            try {
                await pocket.accessToken();
            } catch {
                return msg.edit(this.Embed.fail('Khafra-Bot wasn\'t authorized.'));
            }

            const { access_token, request_token, username } = pocket.toObject();
            // Insert into the table, if username or user_id is already in,
            // we will update the values. Useful if user unauthorizes Khafra-Bot.
            await pool.query(`
                INSERT INTO kbPocket (
                    user_id, access_token, request_token, username
                ) VALUES (
                    $1::text, $2::text, $3::text, $4::text
                ) ON CONFLICT (user_id, username) DO UPDATE SET 
                    user_id = $1::text, 
                    access_token = $2::text, 
                    request_token = $3::text, 
                    username = $4::text
                ;
            `, [message.author.id, access_token, request_token, username]);

            return msg.edit(this.Embed.success(`
            You have authorized ${message.guild.me}!

            Try adding an article with \`\`pocketadd\`\` now. 👍
            `));
        });

        collector.on('end', () => msg.reactions.removeAll());
    }
}