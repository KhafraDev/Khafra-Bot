import { Command } from '#khaf/Command';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isDM, isExplicitText, isStage, isText, isThread, isVoice } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import type { MessageActionRowComponent} from '@discordjs/builders';
import { ActionRow, inlineCode, type UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { GuildBasedChannel, GuildChannelCloneOptions, Message } from 'discord.js';
import { GuildChannel } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Delete a channel and clone it.',
                '#channel',
                '772957951941673000'
            ],
            {
                name: 'clonechannel',
                aliases: ['channelclone', 'clone'],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true,
                ratelimit: 30,
                permissions: [
                    PermissionFlagsBits.ManageChannels
                ]
            }
        );
    }

    async init (message: Message<true>): Promise<UnsafeEmbed | undefined> {
        const channel = await getMentions(message, 'channels') ?? message.channel;

        if (isThread(channel) || isDM(channel)) {
            return Embed.error(`I cannot clone a ${channel.type} channel!`);
        }

        const [e, m] = await dontThrow(message.reply({
            embeds: [
                Embed.ok(`
                Are you sure you want to clone ${channel}? The channel will be deleted and re-created; all pins will be lost.
                `)
            ],
            components: [
                new ActionRow<MessageActionRowComponent>().addComponents(
                    Components.approve('Yes', 'approve'),
                    Components.deny('No', 'deny')
                )
            ]
        }));

        if (e !== null) return;

        {
            const [e, i] = await dontThrow(m.awaitMessageComponent({
                filter: (interaction) =>
                    ['approve', 'deny'].includes(interaction.customId) &&
                    interaction.user.id === message.author.id,
                time: 60_000
            }));

            if (e !== null) {
                return Embed.error('No response, command was canceled!');
            } else if (i.customId === 'deny') {
                return Embed.error(`Command was canceled, ${channel} will not be cloned.`);
            }
        }

        const opts = {
            name: channel.name,
            permissionOverwrites: channel.permissionOverwrites.cache,
            topic: isText(channel) || isStage(channel) ? channel.topic : undefined,
            type: channel.type,
            nsfw: isText(channel) ? channel.nsfw : undefined,
            parent: channel.parent,
            bitrate: isStage(channel) || isVoice(channel) ? channel.bitrate : undefined,
            userLimit: isStage(channel) || isVoice(channel) ? channel.userLimit : undefined,
            rateLimitPerUser: isExplicitText(channel) ? channel.rateLimitPerUser : undefined,
            position: channel.position
        } as GuildChannelCloneOptions;

        const clone = GuildChannel.prototype.clone.bind({
            ...opts,
            guild: message.guild,
            permissionOverwrites: channel.permissionOverwrites
        });

        {
            const [err] = await dontThrow<GuildBasedChannel>(channel.delete());
            if (err !== null) {
                return Embed.error(`Failed to delete the channel: ${inlineCode(err.message)}.`);
            }
        }

        const [err, cloned] = await dontThrow(clone(opts));

        if (err !== null) {
            return void dontThrow(message.author.send({
                embeds: [Embed.error(`An error prevented me from cloning the channel: ${inlineCode(err.message)}.`)]
            }));
        }

        const embed = Embed.ok(`Cloned channel #${opts.name} -> ${cloned}!`);

        if (isText(cloned)) {
            return void dontThrow(cloned.send({ embeds: [embed] }));
        } else {
            return void dontThrow(message.author.send({ embeds: [embed] }));
        }
    }
}