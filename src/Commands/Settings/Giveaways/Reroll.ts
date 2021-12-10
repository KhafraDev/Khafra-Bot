import { bold, hyperlink } from '@khaf/builders';
import { Channel, GuildChannel, Permissions, TextChannel, ThreadChannel, User } from 'discord.js';
import { isText, Message } from '../../../lib/types/Discord.js.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { validSnowflake } from '../../../lib/Utility/Mentions.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { plural } from '../../../lib/Utility/String.js';
import { URLFactory } from '../../../lib/Utility/Valid/URL.js';
import { Arguments, Command } from '../../../Structures/Command.js';

const channelsURLReg = /^\/channels\/(?<guildId>\d{17,19})\/(?<channelId>\d{17,19})\/(?<messageId>\d{17,19})\/?$/;
const perms = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.READ_MESSAGE_HISTORY
]);

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Giveaway: re-roll a giveaway that already ended. Chooses new winners!',
                'https://discord.com/channels/503024525076725771/688943609348882456/863971201826422814 [giveaway message link]'
            ],
			{
                name: 'giveaway:reroll',
                folder: 'Giveaways',
                aliases: ['giveaways:reroll'],
                args: [1, 1],
                guildOnly: true,
                permissions: [
                    // need to fetch an uncached message
                    Permissions.FLAGS.READ_MESSAGE_HISTORY
                ]
            }
        );
    }

    async init(message: Message, { args, commandName }: Arguments) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.perms(
                message.channel as TextChannel,
                message.member,
                Permissions.FLAGS.ADMINISTRATOR
            );
        } else if (
            commandName.toLowerCase() === 'giveaway' || 
            commandName.toLowerCase() === 'giveaways'
        ) {
            args.shift();
        }

        const messageURL = URLFactory(args[0]);

        if (messageURL === null) {
            return this.Embed.error(`The first argument must be a discord.com link!`);
        } else if (
            messageURL.hostname !== 'discord.com' &&
            messageURL.hostname !== 'canary.discord.com' ||
            !channelsURLReg.test(messageURL.pathname)
        ) {
            return this.Embed.error(`The first argument must be a link to a message!`);
        }

        const match = channelsURLReg.exec(messageURL.pathname)!.groups!;
        const { guildId, channelId, messageId } = match;

        if (
            !validSnowflake(messageId) ||
            !validSnowflake(channelId) ||
            !validSnowflake(guildId)
        ) {
            return this.Embed.error(`An invalid message link was sent! :(`);
        }

        if (guildId !== message.guild.id) {
            return this.Embed.error(`Cannot re-roll a giveaway that isn't from this guild!`);
        }

        let channel: GuildChannel | ThreadChannel | null | Channel = message.guild.channels.cache.get(channelId) ?? null;
        if (!channel) {
            ([, channel] = await dontThrow(message.client.channels.fetch(channelId)));
        }

        if (!isText(channel)) {
            return this.Embed.error(`${channel} isn't a text or news channel! You can't have a giveaway here.`);
        } else if (!hasPerms(channel, message.guild.me, perms)) {
            return this.Embed.error(`I cannot view old messages, send messages, and/or the channel is private (lacking perms)!`);
        }

        const [fetchMessageError, m] = await dontThrow(channel.messages.fetch(messageId));
        
        if (fetchMessageError !== null) {
            return this.Embed.error(`Could not fetch the message! Was it deleted?`);
        } else if (
            !m ||
            m.author.id !== message.client.user!.id ||
            m.embeds.length !== 1 ||
            m.embeds[0].timestamp! > Date.now()
        ) {
            return this.Embed.error(`${hyperlink('This', m?.url ?? 'https://discord.gg')} is not a giveaway.`);
        } else if (!m.reactions.cache.has('🎉')) {
            return this.Embed.error(`This message has no 🎉 reactions.`);
        }

        const { count, users } = m.reactions.cache.get('🎉')!;
        const numWinners = Number(/^(\d+)\s/.exec(m.embeds[0].footer!.text)![1]);
        const winners: User[] = [];
        
        if (count !== users.cache.size) {
            await dontThrow(users.fetch());
        }

        if (count > numWinners) {
            while (winners.length < numWinners) {
                const random = users.cache.random();
                if (!random) break;
                if (random.bot) continue;
                if (winners.some(u => u.id === random.id)) continue;

                winners.push(random);
            }
        } else if (count === 1 && users.cache.first()!.id === message.client.user!.id) { // no one entered
            if (m.editable) {
                return void dontThrow(m.edit({
                    content: `${bold('Re-rolled:')} No one entered the giveaway!`
                }));
            } else {
                return void dontThrow(m.channel.send({
                    content: `${bold('Re-Rolled:')} No one entered the giveaway!`
                }));
            }
        } else if (count <= numWinners) { // less entered than number of winners
            for (const user of users.cache.values()) {
                if (user.bot) continue;
                winners.push(user);
            }
        }

        const isAre = winners.length === 1 ? 'is' : 'are';
        const line = `${bold('Re-Rolled:')} the winner${plural(winners.length)} ${isAre} ${winners.join(', ')}!`;

        if (m.editable) {
            await dontThrow(m.edit({ content: line }));
        } else {
            await dontThrow(m.channel.send({
                content: line,
                embeds: m.embeds
            }));
        }

        return this.Embed.ok(`Re-rolled the giveaway! [${hyperlink('URL', m.url)}]`);
    }
}