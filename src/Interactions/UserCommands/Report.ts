import { InteractionUserCommand } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isTextBased } from '#khaf/utility/Discord.js';
import { interactionFetchChannel, interactionGetGuildSettings } from '#khaf/utility/Discord/Interaction Util.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { codeBlock, hideLinkEmbed, hyperlink } from '@khaf/builders';
import { ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { Message, MessageContextMenuCommandInteraction } from 'discord.js';

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

    async init (interaction: MessageContextMenuCommandInteraction): Promise<string> {        
        const settings = await interactionGetGuildSettings(interaction);

        if (!settings?.staffChannel) {
            return `❌ The staff channel hasn't been setup in the guild yet, ask an admin to set it up!`;
        }

        const channel = await interactionFetchChannel(interaction, settings.staffChannel);
        const { content, author, id } = interaction.targetMessage;
        const channelId = interaction.targetMessage instanceof Message
            ? interaction.targetMessage.channelId
            : interaction.targetMessage.channel_id;
        const messageURL = `https://discord.com/channels/${interaction.guildId ?? '@me'}/${channelId}/${id}`;
        
        if (!channel) {
            return `❌ No staff channel could be found, was it deleted or were my perms taken away?`;
        } else if (!isTextBased(channel)) {
            return `❌ I can only send messages in text based channels, sorry!`;   
        }

        const [err] = await dontThrow(channel.send({
            embeds: [
                Embed.ok()
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTitle(`Message Reported!`)
                    .setDescription(`
                    ${interaction.user} reported <@${author.id}>'s ${hyperlink('message', hideLinkEmbed(messageURL))}:

                    ${codeBlock(content)}
                    `)
            ]
        }));

        if (err !== null) {
            return `❌ I could not report this message to the staff channel.`;
        }

        // we can't have ephemeral context menu replies
        // https://discord.com/channels/613425648685547541/788586647142793246/930862115693162506
        // but we need to respond and have it be anonymous.
        return `✅ Reported the message to staff!`;
    }
} 