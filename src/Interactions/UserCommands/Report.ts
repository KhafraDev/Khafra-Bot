import { InteractionUserCommand } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isTextBased } from '#khaf/utility/Discord.js';
import { interactionFetchChannel, interactionGetGuildSettings } from '#khaf/utility/Discord/Interaction Util.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { codeBlock, hideLinkEmbed, hyperlink } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandType } from 'discord-api-types/v10';
import type { InteractionReplyOptions, MessageContextMenuCommandInteraction } from 'discord.js';
import { argv } from 'process';

const args = new Minimalist(argv.slice(2).join(' '));
const isDev = args.get('dev') === true;

export class kUserCommand extends InteractionUserCommand {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'Report Message',
            type: ApplicationCommandType.Message
        };

        super(sc, {
            defer: true
        });
    }

    async init (interaction: MessageContextMenuCommandInteraction): Promise<InteractionReplyOptions | void> {
        const settings = await interactionGetGuildSettings(interaction);

        if (!settings?.staffChannel) {
            return {
                content: '❌ The staff channel hasn\'t been setup in the guild yet, ask an admin to set it up!',
                ephemeral: true
            }
        }

        const channel = await interactionFetchChannel(interaction, settings.staffChannel);
        const { content, author, id, attachments } = interaction.targetMessage;

        if (isDev === false) {
            if (author.id === interaction.user.id) {
                return {
                    content: '❌ You cannot report your own message.',
                    ephemeral: true
                }
            } else if (author.bot === true) {
                return {
                    content: '❌ You cannot report messages from bots.',
                    ephemeral: true
                }
            }
        }

        const channelId = 'channelId' in interaction.targetMessage
            ? interaction.targetMessage.channelId
            : interaction.targetMessage.channel_id;
        const messageURL = `https://discord.com/channels/${interaction.guildId ?? '@me'}/${channelId}/${id}`;

        if (!channel) {
            return {
                content: '❌ No staff channel could be found, was it deleted or were my perms taken away?',
                ephemeral: true
            }
        } else if (!isTextBased(channel)) {
            return {
                content: '❌ I can only send messages in text based channels, sorry!',
                ephemeral: true
            }
        }

        const m = `<@${author.id}>'s ${hyperlink('message', hideLinkEmbed(messageURL))}`;
        const a = Array.isArray(attachments) ? attachments : [...attachments.values()];

        const [err] = await dontThrow(channel.send({
            content: a.length === 0
                ? undefined
                : a.map(att => 'proxyURL' in att ? att.proxyURL : att.proxy_url).join('\n'),
            embeds: [
                Embed.ok()
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTitle('Message Reported!')
                    .setDescription(`
                    ${interaction.user} reported ${m}:

                    ${content.length !== 0 ? codeBlock(content) : ''}
                    `.trimEnd())
            ]
        }));

        if (err !== null) {
            return {
                content: '❌ I could not report this message to the staff channel.',
                ephemeral: true
            }
        }

        // Context menu replies cannot be ephemeral, but you can send a
        // normal reply, delete it, and then follow up to the interaction
        // with an ephemeral message. This sucks, but Discord explicitly
        // doesn't want to allow ephemeral context menu replies.
        await dontThrow(interaction.editReply({
            content: '✅ Reported the message to staff!'
        }));
        await dontThrow(interaction.deleteReply());
        await dontThrow(interaction.followUp({
            content: `Reported ${m}!`,
            ephemeral: true
        }));
    }
}