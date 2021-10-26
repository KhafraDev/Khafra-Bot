import { Arguments, Command } from '../../../Structures/Command.js';
import { isDM, isExplicitText, isThread, Message } from '../../../lib/types/Discord.js.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { kGuild } from '../../../lib/types/KhafraBot.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { TextChannel, CategoryChannel, GuildChannel, Permissions, ThreadChannel } from 'discord.js';

type TicketChannelTypes = TextChannel | CategoryChannel;
const channelTicketName = /^Ticket-[0-9a-f]{8}$/i;
const memberPermsExpected = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES
]);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
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

    async init(message: Message, _args: Arguments, settings: kGuild) {
        if (settings.ticketchannel === null) {
            return this.Embed.fail(`Could not archive for you, the guild's ticket channel is unset.`);
        } else if (!isDM(message.channel) && !channelTicketName.test(message.channel.name)) {
            return this.Embed.fail(`This is not a ticket channel.`);
        }

        const everyoneId = message.guild.roles.everyone.id;

        if (isThread(message.channel)) {
            if (message.channel.permissionsFor(everyoneId)?.has(Permissions.FLAGS.VIEW_CHANNEL)) {
                return this.Embed.fail(`${message.channel} is not private!`);
            }
        } else {
            const perms = (message.channel as GuildChannel).permissionOverwrites.cache;

            if (!perms.has(message.author.id) || !perms.get(everyoneId)) {
                return this.Embed.fail(`Incorrect permissions setup for ${message.channel}!`);
            } else {
                const memberPerms = perms.get(message.author.id)!;
                const everyonePerms = perms.get(everyoneId)!;

                if (!memberPerms.allow.has(memberPermsExpected)) {
                    return this.Embed.fail(`You are missing some required permissions in this channel.`);
                } else if (!everyonePerms.deny.has(Permissions.FLAGS.VIEW_CHANNEL)) {
                    return this.Embed.fail(`This channel is not private!`);
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
                return this.Embed.fail(`An error occurred trying to fetch this channel. Maybe set a new ticket channel?`);
            } else {
                // validation is done in the ticketchannel command
                channel = chan as TicketChannelTypes;
            }
        } else {
            channel = ret as TicketChannelTypes;
        }
        
        if (isExplicitText(channel) && !isThread(message.channel)) {
            return this.Embed.fail(`Expected thread, got ${message.channel.type}.`);
        }

        if (isExplicitText(channel)) {
            await dontThrow((message.channel as ThreadChannel).setArchived(true, `requested by ${message.author.id}`));
        } else {
            await dontThrow(message.channel.delete());
        }

        return void dontThrow(message.author.send({ content: `Ticket was archived/deleted.` }));
    }
}