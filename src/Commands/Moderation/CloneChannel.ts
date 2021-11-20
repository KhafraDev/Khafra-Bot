import { Command } from '../../Structures/Command.js';
import { GuildChannel, GuildChannelCloneOptions, MessageActionRow, Permissions } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { isDM, isExplicitText, isStage, isText, isThread, isVoice, Message } from '../../lib/types/Discord.js.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { inlineCode } from '@khaf/builders';
import { Components } from '../../lib/Utility/Constants/Components.js';

export class kCommand extends Command {
    constructor() {
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
                permissions: [Permissions.FLAGS.MANAGE_CHANNELS]
            }
        );
    }

    async init(message: Message) {
        const channel = await getMentions(message, 'channels') ?? message.channel;
        if (!channel) {
            return this.Embed.fail(`Channel isn't cached or the ID is incorrect.`);
        } else if (isThread(channel) || isDM(channel)) {
            return this.Embed.fail(`I cannot clone a ${channel.type} channel!`);
        }

        const [e, m] = await dontThrow(message.reply({
            embeds: [
                this.Embed.success(`
                Are you sure you want to clone ${channel}? The channel will be deleted and re-created; all pins will be lost.
                `)
            ],
            components: [
                new MessageActionRow().addComponents(
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

            if (e !== null || !i) {
                return this.Embed.fail(`No response, command was canceled!`);
            } else if (i.customId === 'deny') {
                return this.Embed.fail(`Command was canceled, ${channel} will not be cloned.`);
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
            const [err] = await dontThrow(channel.delete());
            if (err !== null) {
                return this.Embed.fail(`Failed to delete the channel: ${inlineCode(err.message)}.`);
            }
        }

        const [err, cloned] = await dontThrow(clone(opts));

        if (err !== null) {
            return void dontThrow(message.author.send({
                embeds: [this.Embed.fail(`An error prevented me from cloning the channel: ${inlineCode(err.message)}.`)]
            }));
        }

        const embed = this.Embed.success(`Cloned channel #${opts.name} -> ${cloned}!`);

        if (isText(cloned)) {
            return void dontThrow(cloned.send({ embeds: [embed] }));
        } else {
            return void dontThrow(message.author.send({ embeds: [embed] }));
        }
    }
}