import { Arguments, Command } from '../../../Structures/Command.js';
import { isExplicitText, Message } from '../../../lib/types/Discord.js.js';
import { kGuild } from '../../../lib/types/KhafraBot.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { CategoryChannel, Permissions, TextChannel } from 'discord.js';
import { ChannelType } from 'discord-api-types/v9';
import { randomUUID } from 'crypto';
import { inlineCode } from '@khaf/builders';

type TicketChannelTypes = TextChannel | CategoryChannel;

export class kCommand extends Command {
    constructor() {
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

    async init(message: Message, { args, commandName, prefix }: Arguments, settings: kGuild) {
        if (settings.ticketchannel === null) {
            return this.Embed.fail(`This guild doesn't have a ticket channel! Ask a moderator to use \`${prefix}ticketchanel [channel]\`!`);
        } else if (commandName === 'ticket' || commandName === 'tickets') {
            args.shift();
        } 

        /** guild can use private threads */
        const privateThreads = /^TIER_[2-9]$/.test(message.guild.premiumTier);

        const ret = message.guild.channels.cache.has(settings.ticketchannel)
            ? message.guild.channels.cache.get(settings.ticketchannel)!
            : await dontThrow(message.guild.channels.fetch(settings.ticketchannel));

        let channel!: TicketChannelTypes;
        if (Array.isArray(ret)) {
            const [err, chan] = ret;
            if (err !== null) {
                return this.Embed.fail(`An error occurred trying to fetch this channel. Maybe set a new ticket channel?`);
            } else {
                // validation is done in the ticketchannel command
                channel = chan as TicketChannelTypes;
            }
        } else {
            channel = ret as TicketChannelTypes;
        }

        if (isExplicitText(channel) && !privateThreads) {
            return this.Embed.fail(
                `This guild is no longer tier 2 or above, and cannot use private threads. ` +
                `Use the \`${prefix}ticketchannel\` command to re-set the ticket channel!`
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
                return this.Embed.fail(`Failed to create a ticket: ${inlineCode(err.message)}.`);
            }

            await dontThrow(thread.members.add(message.author));
            void dontThrow(thread.send(`${message.author}: ${args.join(' ')}`));

            return this.Embed.success(`Successfully created a ticket: ${thread}!`);
        } else {
            // create normal text channel with permissions for message.author
            const [err, ticketChannel] = await dontThrow(message.guild.channels.create(name, {
                type: ChannelType.GuildText as number,
                parent: channel,
                permissionOverwrites: [
                    {
                        type: 'role',
                        id: message.guild.roles.everyone.id,
                        deny: [ Permissions.FLAGS.VIEW_CHANNEL ]
                    },
                    {
                        type: 'member',
                        id: message.member.id,
                        allow: [
                            Permissions.FLAGS.VIEW_CHANNEL,
                            Permissions.FLAGS.SEND_MESSAGES,
                            Permissions.FLAGS.READ_MESSAGE_HISTORY
                        ]
                    }
                ]
            }) as Promise<TextChannel>);

            if (err !== null) {
                return this.Embed.fail(`Failed to create a ticket: ${inlineCode(err.message)}.`);
            }
            
            void dontThrow(ticketChannel.send({ content: `${message.author}: ${args.join(' ')}` }));
            
            return this.Embed.success(`Successfully created a ticket: ${ticketChannel}!`);
        }
    }
}