import { Arguments, Command } from '#khaf/Command';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isExplicitText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode, type UnsafeEmbed } from '@discordjs/builders';
import { randomUUID } from 'crypto';
import { ChannelType, GuildPremiumTier, OverwriteType, PermissionFlagsBits } from 'discord-api-types/v10';
import { CategoryChannel, Message, TextChannel } from 'discord.js';

type TicketChannelTypes = TextChannel | CategoryChannel;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Create a ticket!',
                'This is the reason that the ticket is being created'
            ],
            {
                name: 'ticket:create',
                folder: 'Server',
                aliases: ['tickets:create'],
                args: [0],
                ratelimit: 30,
                guildOnly: true
            }
        );
    }

    async init (message: Message<true>, { args, commandName }: Arguments, settings: kGuild): Promise<UnsafeEmbed> {
        if (settings.ticketchannel === null) {
            return Embed.error('This guild doesn\'t have a ticket channel! Ask a moderator to use `ticketchanel [channel]`!');
        } else if (commandName === 'ticket' || commandName === 'tickets') {
            args.shift();
        }

        /** guild can use private threads */
        const privateThreads =
            message.guild.premiumTier !== GuildPremiumTier.None &&
            message.guild.premiumTier !== GuildPremiumTier.Tier1;

        const ret = message.guild.channels.cache.has(settings.ticketchannel)
            ? message.guild.channels.cache.get(settings.ticketchannel)!
            : await dontThrow(message.guild.channels.fetch(settings.ticketchannel));

        let channel!: TicketChannelTypes;
        if (Array.isArray(ret)) {
            const [err, chan] = ret;
            if (err !== null) {
                return Embed.error('An error occurred trying to fetch this channel. Maybe set a new ticket channel?');
            } else {
                // validation is done in the ticketchannel command
                channel = chan as TicketChannelTypes;
            }
        } else {
            channel = ret as TicketChannelTypes;
        }

        if (isExplicitText(channel) && !privateThreads) {
            return Embed.error(
                'This guild is no longer tier 2 or above, and cannot use private threads. ' +
                'Use the `ticketchannel` command to re-set the ticket channel!'
            );
        }

        const uuid = randomUUID();
        const name = `Ticket-${uuid.slice(0, uuid.indexOf('-'))}`;

        if (isExplicitText(channel)) {
            const [err, thread] = await dontThrow(channel.threads.create({
                type: ChannelType.GuildPrivateThread,
                name: name,
                autoArchiveDuration: 'MAX',
                reason: `${message.author.tag} (${message.author.id}) created a support ticket.`
            }));

            if (err !== null) {
                return Embed.error(`Failed to create a ticket: ${inlineCode(err.message)}.`);
            }

            await dontThrow(thread.members.add(message.author));
            void dontThrow(thread.send(`${message.author}: ${args.join(' ')}`));

            return Embed.ok(`Successfully created a ticket: ${thread}!`);
        } else {
            // create normal text channel with permissions for message.author
            const [err, ticketChannel] = await dontThrow(message.guild.channels.create(name, {
                type: ChannelType.GuildText,
                parent: channel,
                permissionOverwrites: [
                    {
                        type: OverwriteType.Role,
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        type: OverwriteType.Member,
                        id: message.author.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            }));

            if (err !== null) {
                return Embed.error(`Failed to create a ticket: ${inlineCode(err.message)}.`);
            }

            void dontThrow(ticketChannel.send({ content: `${message.author}: ${args.join(' ')}` }));

            return Embed.ok(`Successfully created a ticket: ${ticketChannel}!`);
        }
    }
}