import { Command } from '#khaf/Command';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isCategory, isStage, isThread, isVoice } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import type { MessageActionRowComponentBuilder} from '@discordjs/builders';
import { ActionRowBuilder, bold, inlineCode, italic, type UnsafeEmbedBuilder } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { GuildChannel, Message } from 'discord.js';

const threadPerms =
    PermissionFlagsBits.ManageThreads |
    PermissionFlagsBits.CreatePublicThreads |
    PermissionFlagsBits.CreatePrivateThreads |
    PermissionFlagsBits.SendMessagesInThreads;

export class kCommand extends Command {
    constructor () {
        super(
            [
                `By default, Discord threads are allowed to be created by ${italic('anyone')}. This command disables all 3 default permissions.`
            ],
            {
                name: 'fthreads',
                aliases: ['fthread', 'fuckthread', 'fuckthreads'],
                folder: 'Moderation',
                args: [0],
                guildOnly: true,
                ratelimit: 1,
                permissions: [
                    PermissionFlagsBits.ManageChannels
                ]
            }
        );
    }

    async init (message: Message<true>): Promise<UnsafeEmbedBuilder | undefined> {
        const [e, m] = await dontThrow(message.reply({
            embeds: [
                Embed.ok(`
                Are you sure you want to disable these permissions for everyone? This cannot be reverted by the bot!
                `)
            ],
            components: [
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
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
                return Embed.error('Command was canceled, permissions will not be disabled!');
            } else {
                void i.update({ components: disableAll(m) });
            }
        }

        const [fetchErr, allChannels] = await dontThrow(message.guild.channels.fetch());

        if (fetchErr !== null) {
            return Embed.error(`An unexpected error occurred: ${inlineCode(fetchErr.message)}.`);
        }

        const channels = allChannels.filter(c =>
            !isStage(c) &&
            !isThread(c) &&
            !isVoice(c) &&
            !c.permissionsLocked
        );

        const pr: Promise<GuildChannel>[] = [];
        for (const [, channel] of channels) {
            const overwrites = channel.permissionOverwrites.cache.get(message.guild.roles.everyone.id);
            const denied = overwrites?.deny.has(threadPerms);

            if (!denied) {
                if (!hasPerms(channel, message.guild.me, PermissionFlagsBits.ManageChannels)) continue;
                if (!hasPerms(channel, message.member, PermissionFlagsBits.ManageChannels)) continue;

                pr.push(channel.permissionOverwrites.edit(
                    message.guild.roles.everyone,
                    {
                        CreatePublicThreads: false,
                        CreatePrivateThreads: false,
                        ManageThreads: false
                    }
                ));
            }
        }

        if (pr.length === 0) {
            return Embed.ok('No channel permissions needed to be updated!');
        }

        const settled = await Promise.allSettled(pr);
        const success = settled.filter((p): p is PromiseFulfilledResult<GuildChannel> => p.status === 'fulfilled');
        const rejected = settled.filter((p): p is PromiseRejectedResult => p.status === 'rejected');

        let description = '';
        const embed = Embed.ok()
            .setTitle(`Edited ${success.length} Channel Perms!`)
            .setAuthor({
                name: message.guild.name,
                iconURL: message.guild.bannerURL() ?? undefined
            });

        if (success.length > 0)
            description += `${bold('Success:')}\n`;

        while (success.length !== 0 && description.length < 2048) {
            const { value } = success.shift()!;
            const line = isCategory(value)
                ? `Category ${inlineCode(value.name)}\n`
                : `${value}\n`;
            if (description.length + line.length > 2048) break;

            description += line;
        }

        if (rejected.length > 0 && description.length + `\n\n${bold('Rejected!')}\n`.length <= 2048)
            description += `\n${bold('Rejected!')}\n`;

        while (rejected.length !== 0 && description.length < 2048) {
            const { reason } = rejected.shift()! as { reason: Error };
            const line = `${inlineCode(reason.message)}\n`;
            if (description.length + line.length > 2048) break;
            description += line;
        }

        return embed;
    }
}