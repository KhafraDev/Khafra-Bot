import { Command } from '#khaf/Command';
import { sql } from '#khaf/database/Postgres.js';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ActionRow, bold, inlineCode, MessageActionRowComponent } from '@discordjs/builders';
import { Pocket } from '@khaf/pocket';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Pocket: Start the process of authorizing your Pocket account.'
            ],
            {
                name: 'pocketinit',
                folder: 'Pocket',
                args: [0, 0],
                ratelimit: 300,
                permissions: [
                    PermissionFlagsBits.AddReactions,
                    PermissionFlagsBits.ManageEmojisAndStickers
                ]
            }
        );
    }

    async init (message: Message): Promise<undefined> {
        const pocket = new Pocket();
        pocket.redirect_uri = `https://discord.com/channels/${message.guild!.id}/${message.channel.id}`;

        await pocket.requestCode();

        const embed = Embed.ok(`
        Authorize Khafra-Bot using the link below! 
        
        [Click Here](${pocket.requestAuthorization})!
        After authorizing click the approve ✅ button, or click the cancel ❌ button to cancel! 
        
        ${bold('Command will be canceled after 2 minutes automatically.')}
        `)
            .setTitle('Pocket');

        const row = new ActionRow<MessageActionRowComponent>().addComponents(
            Components.approve('Approve'),
            Components.deny('Cancel')
        );

        const msg = await message.reply({
            embeds: [embed],
            components: [row]
        });

        const [buttonErr, button] = await dontThrow(msg.awaitMessageComponent({
            filter: (interaction) =>
                interaction.isMessageComponent() &&
                ['approve', 'deny'].includes(interaction.customId) &&
                interaction.user.id === message.author.id,
            time: 120_000
        }));

        if (buttonErr !== null) {
            return void msg.edit({
                embeds: [Embed.error('Canceled the command, took over 2 minutes.')],
                components: []
            });
        }

        await button.deferUpdate();

        if (button.customId === 'approve') {
            const [authError] = await dontThrow(pocket.accessToken());

            if (authError !== null) {
                return void dontThrow(button.editReply({
                    embeds: [Embed.error('Khafra-Bot wasn\'t authorized.')],
                    components: []
                }));
            }

            const { access_token, request_token, username } = pocket.toObject();

            if (!access_token || !request_token || !username) {
                return void dontThrow(button.editReply({
                    embeds: [Embed.error('An unexpected issue occurred.')],
                    components: []
                }));
            }

            // Insert into the table, if username or user_id is already in,
            // we will update the values. Useful if user unauthorizes Khafra-Bot.
            await sql<unknown[]>`
                INSERT INTO kbPocket (
                    user_id, access_token, request_token, username
                ) VALUES (
                    ${message.author.id}::text,
                    ${access_token}::text,
                    ${request_token}::text,
                    ${username}::text
                ) ON CONFLICT (user_id, username) DO UPDATE SET 
                    user_id = ${message.author.id}::text, 
                    access_token = ${access_token}::text, 
                    request_token = ${request_token}::text, 
                    username = ${username}::text
                ;
            `;

            return void button.editReply({
                embeds: [
                    Embed.ok(`
                    You have authorized ${message.guild!.me}!

                    Try adding an article with ${inlineCode('pocketadd')} now. 👍
                    `)
                ],
                components: disableAll(msg)
            });
        }

        return void button.editReply({
            embeds: [Embed.error('Khafra-Bot wasn\'t authorized, command was canceled!')],
            components: disableAll(msg)
        });
    }
}