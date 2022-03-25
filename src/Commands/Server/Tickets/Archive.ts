import { Arguments, Command } from '#khaf/Command';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isDM, isExplicitText, isThread } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import type { UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { CategoryChannel, Message, NewsChannel, TextChannel, ThreadChannel } from 'discord.js';

type TicketChannelTypes = TextChannel | CategoryChannel;
type DeletedChannelTypes = TextChannel | NewsChannel | ThreadChannel;

const channelTicketName = /^Ticket-[0-9a-f]{8}$/i;
const memberPermsExpected =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Archives or deletes a ticket!'
            ],
            {
                name: 'ticket:archive',
                folder: 'Server',
                aliases: ['tickets:archive', 'tickets:delete', 'tickets:delete'],
                args: [0, 0],
                ratelimit: 30,
                guildOnly: true
            }
        );
    }

    async init (message: Message<true>, _args: Arguments, settings: kGuild): Promise<UnsafeEmbed | undefined> {
        if (settings.ticketchannel === null) {
            return Embed.error('Could not archive for you, the guild\'s ticket channel is unset.');
        } else if (!isDM(message.channel) && !channelTicketName.test(message.channel.name)) {
            return Embed.error('This is not a ticket channel.');
        }

        const everyoneId = message.guild.roles.everyone.id;

        if (isThread(message.channel)) {
            if (message.channel.permissionsFor(everyoneId)?.has(PermissionFlagsBits.ViewChannel)) {
                return Embed.error(`${message.channel} is not private!`);
            }
        } else {
            const perms = message.channel.permissionOverwrites.cache;

            if (!perms.has(message.author.id) || !perms.get(everyoneId)) {
                return Embed.error(`Incorrect permissions setup for ${message.channel}!`);
            } else {
                const memberPerms = perms.get(message.author.id)!;
                const everyonePerms = perms.get(everyoneId)!;

                if (!memberPerms.allow.has(memberPermsExpected)) {
                    return Embed.error('You are missing some required permissions in this channel.');
                } else if (!everyonePerms.deny.has(PermissionFlagsBits.ViewChannel)) {
                    return Embed.error('This channel is not private!');
                }
            }
        }

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

        if (isExplicitText(channel) && !isThread(message.channel)) {
            return Embed.error(`Expected thread, got ${message.channel.type}.`);
        }

        if (isExplicitText(channel)) {
            await dontThrow((message.channel as ThreadChannel).setArchived(true, `requested by ${message.author.id}`));
        } else {
            await dontThrow<DeletedChannelTypes>(message.channel.delete());
        }

        return void dontThrow(message.author.send({ content: 'Ticket was archived/deleted.' }));
    }
}