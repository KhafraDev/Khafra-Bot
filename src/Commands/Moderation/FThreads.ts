import { Command } from '../../Structures/Command.js';
import { Collection, GuildChannel, MessageActionRow, NewsChannel, Permissions, Snowflake, TextChannel } from 'discord.js';
import { isCategory, isStage, isThread, isVoice, Message } from '../../lib/types/Discord.js.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { Components, disableAll } from '../../lib/Utility/Constants/Components.js';
import { inlineCode } from '@discordjs/builders';
import { hasPerms } from '../../lib/Utility/Permissions.js';

const threadPerms = new Permissions([
    Permissions.FLAGS.MANAGE_THREADS,
    Permissions.FLAGS.CREATE_PUBLIC_THREADS,
    Permissions.FLAGS.CREATE_PRIVATE_THREADS,
    Permissions.FLAGS.SEND_MESSAGES_IN_THREADS
]);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'By default, Discord threads are allowed to be created by *anyone*. This command disables all 3 default permissions.',
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

    async init(message: Message) {
        const [e, m] = await dontThrow(message.reply({
            embeds: [
                this.Embed.success(`
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
                return this.Embed.fail(`No response, command was canceled!`);
            } else if (i.customId === 'deny') {
                return this.Embed.fail(`Command was canceled, permissions will not be disabled!`);
            } else {
                void i.update({ components: disableAll(m) });
            }
        }

        const [fetchErr, allChannels] = await dontThrow(message.guild.channels.fetch());

        if (fetchErr !== null) {
            return this.Embed.fail(`An unexpected error occurred: ${inlineCode(fetchErr.message)}.`);
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
            return this.Embed.success('No channel permissions needed to be updated!');
        }

        const settled = await Promise.allSettled(pr);
        const success = settled.filter((p): p is PromiseFulfilledResult<GuildChannel> => p.status === 'fulfilled');
        const rejected = settled.filter((p): p is PromiseRejectedResult => p.status === 'rejected');

        const embed = this.Embed.success()
            .setTitle(`Edited ${success.length} Channel Perms!`)
            .setAuthor(message.guild.name, message.guild.bannerURL() ?? undefined);

        if (success.length > 0)
            embed.description = '**Success:**\n';

        while (success.length !== 0 && embed.description!.length < 2048) {
            const { value } = success.shift()!;
            const line = isCategory(value)
                ? `Category ${inlineCode(value.name)}\n`
                : `${value}\n`;
            if (embed.description!.length + line.length > 2048) break;
            embed.description += line;
        }

        if (rejected.length > 0 && embed.description!.length + '\n\n**Rejected!**\n'.length <= 2048) 
            embed.description += '\n**Rejected!**\n';

        while (rejected.length !== 0 && embed.description!.length < 2048) {
            const { reason } = rejected.shift()! as { reason: Error };
            const line = `${inlineCode(reason.message)}\n`;
            if (embed.description!.length + line.length > 2048) break;
            embed.description += line;
        }

        return embed;
    }
}