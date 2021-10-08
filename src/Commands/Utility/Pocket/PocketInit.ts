import { Command } from '../../../Structures/Command.js';
import { Interaction, Message, MessageActionRow, MessageComponentInteraction, Permissions } from 'discord.js';
import { Pocket } from '@khaf/pocket';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { bold, inlineCode } from '@discordjs/builders';

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
                permissions: [ Permissions.FLAGS.ADD_REACTIONS, Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS ]
            }
        );
    }

    async init(message: Message) {
        const pocket = new Pocket();
        pocket.redirect_uri = `https://discord.com/channels/${message.guild!.id}/${message.channel.id}`;

        await pocket.requestCode();

        const embed = this.Embed.success(`
        Authorize Khafra-Bot using the link below! 
        
        [Click Here](${pocket.requestAuthorization})!
        After authorizing click the approve ✅ button, or click the cancel ❌ button to cancel! 
        
        ${bold('Command will be canceled after 2 minutes automatically.')}
        `)
        .setTitle('Pocket');

        const row = new MessageActionRow()
			.addComponents(
                Components.approve('Approve'),
                Components.deny('Cancel')
            );

        const msg = await message.reply({
            embeds: [embed],
            components: [row]
        });
        
        const filter = (interaction: Interaction) => 
            interaction.isMessageComponent() &&
            ['approve', 'deny'].includes(interaction.customId) && 
            interaction.user.id === message.author.id;

        let button: MessageComponentInteraction | null = null;
        try {
            button = await msg.awaitMessageComponent({ filter, time: 120_000 });
        } catch {
            return void msg.edit({
                embeds: [this.Embed.fail('Canceled the command, took over 2 minutes.')],
                components: []
            });
        }

        await button.deferUpdate();

        if (button.customId === 'approve') {
            try {
                await pocket.accessToken();
            } catch {
                return void button.editReply({
                    embeds: [this.Embed.fail('Khafra-Bot wasn\'t authorized.')], 
                    components: []
                });
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

            return void button.editReply({
                embeds: [
                    this.Embed.success(`
                    You have authorized ${message.guild!.me}!

                    Try adding an article with ${inlineCode('pocketadd')} now. 👍
                    `)
                ],
                components: disableAll(msg)
            });
        }

        return void button.editReply({
            embeds: [this.Embed.fail('Khafra-Bot wasn\'t authorized, command was canceled!')],
            components: disableAll(msg)
        });
    }
}