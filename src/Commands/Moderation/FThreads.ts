import { bold, inlineCode, italic } from '@khaf/builders';
import { Collection, GuildChannel, Message, MessageActionRow, NewsChannel, Permissions, Snowflake, TextChannel } from 'discord.js';
import { isCategory, isStage, isThread, isVoice } from '#khaf/utility/Discord.js';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Command } from '#khaf/Command';

const threadPerms = new Permissions([
    Permissions.FLAGS.MANAGE_THREADS,
    Permissions.FLAGS.CREATE_PUBLIC_THREADS,
    Permissions.FLAGS.CREATE_PRIVATE_THREADS,
    Permissions.FLAGS.SEND_MESSAGES_IN_THREADS
]);

export class kCommand extends Command {
    constructor() {
        super(
            [
                `By default, Discord threads are allowed to be created by ${italic('anyone')}. This command disables all 3 default permissions.`,
            ],
			{
                name: 'fthreads',
                aliases: ['fthread', 'fuckthread', 'fuckthreads'],
                folder: 'Moderation',
                args: [0],
                guildOnly: true,
                ratelimit: 1,
                permissions: [Permissions.FLAGS.MANAGE_CHANNELS]
            }
        );
    }

    async init(message: Message<true>) {
        const [e, m] = await dontThrow(message.reply({
            embeds: [
                this.Embed.ok(`
                Are you sure you want to disable these permissions for everyone? This cannot be reverted by the bot!
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
                return this.Embed.error(`No response, command was canceled!`);
            } else if (i.customId === 'deny') {
                return this.Embed.error(`Command was canceled, permissions will not be disabled!`);
            } else {
                void i.update({ components: disableAll(m) });
            }
        }

        const [fetchErr, allChannels] = await dontThrow(message.guild.channels.fetch());

        if (fetchErr !== null) {
            return this.Embed.error(`An unexpected error occurred: ${inlineCode(fetchErr.message)}.`);
        }

        const channels = allChannels.filter(c => 
            !isStage(c) &&
            !isThread(c) &&
            !isVoice(c) &&
            !c.permissionsLocked
        ) as Collection<Snowflake, TextChannel | NewsChannel>;
    
        const pr: Promise<GuildChannel>[] = [];
        for (const [, channel] of channels) {
            const overwrites = channel.permissionOverwrites.cache.get(message.guild.roles.everyone.id);
            const denied = overwrites?.deny.has(threadPerms);
            
            if (!denied) {
                if (!hasPerms(channel, message.guild.me, Permissions.FLAGS.MANAGE_CHANNELS)) continue;
                if (!hasPerms(channel, message.member, Permissions.FLAGS.MANAGE_CHANNELS)) continue;

                pr.push(channel.permissionOverwrites.edit(
                    message.guild.roles.everyone,
                    {
                        USE_PUBLIC_THREADS: false,
                        USE_PRIVATE_THREADS: false,
                        MANAGE_THREADS: false
                    }
                ));
            }
        }

        if (pr.length === 0) {
            return this.Embed.ok('No channel permissions needed to be updated!');
        }

        const settled = await Promise.allSettled(pr);
        const success = settled.filter((p): p is PromiseFulfilledResult<GuildChannel> => p.status === 'fulfilled');
        const rejected = settled.filter((p): p is PromiseRejectedResult => p.status === 'rejected');

        const embed = this.Embed.ok()
            .setTitle(`Edited ${success.length} Channel Perms!`)
            .setAuthor({
                name: message.guild.name,
                iconURL: message.guild.bannerURL() ?? undefined
            });

        if (success.length > 0)
            embed.description = `${bold('Success:')}\n`;

        while (success.length !== 0 && embed.description!.length < 2048) {
            const { value } = success.shift()!;
            const line = isCategory(value)
                ? `Category ${inlineCode(value.name)}\n`
                : `${value}\n`;
            if (embed.description!.length + line.length > 2048) break;
            embed.description += line;
        }

        if (rejected.length > 0 && embed.description!.length + `\n\n${bold('Rejected!')}\n`.length <= 2048) 
            embed.description += `\n${bold('Rejected!')}\n`;

        while (rejected.length !== 0 && embed.description!.length < 2048) {
            const { reason } = rejected.shift()! as { reason: Error };
            const line = `${inlineCode(reason.message)}\n`;
            if (embed.description!.length + line.length > 2048) break;
            embed.description += line;
        }

        return embed;
    }
}