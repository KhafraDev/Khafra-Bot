import { AnyChannel, ChatInputCommandInteraction, Permissions, User } from 'discord.js';
import { bold, hyperlink, inlineCode } from '@khaf/builders';
import { isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { validSnowflake } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { plural } from '#khaf/utility/String.js';

const channelsURLReg = /^\/channels\/(?<guildId>\d{17,19})\/(?<channelId>\d{17,19})\/(?<messageId>\d{17,19})\/?$/;
const perms = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.READ_MESSAGE_HISTORY
]);

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'giveaway',
            name: 'reroll'
        });
    }

    async handle (interaction: ChatInputCommandInteraction) {
        const messageURL = URLFactory(interaction.options.getString('url', true));

        if (messageURL === null) {
            return `❌ An invalid message link was provided!`;
        } else if (
            messageURL.hostname !== 'discord.com' &&
            messageURL.hostname !== 'canary.discord.com' ||
            !channelsURLReg.test(messageURL.pathname)
        ) {
            return `❌ The first argument must be a link to a message!`;
        }

        const match = channelsURLReg.exec(messageURL.pathname)!.groups!;
        const { guildId, channelId, messageId } = match;

        if (
            !validSnowflake(messageId) ||
            !validSnowflake(channelId) ||
            !validSnowflake(guildId)
        ) {
            return `❌ An invalid message link was sent! :(`;
        }

        if (guildId !== interaction.guildId || !interaction.guild) {
            return `❌ Please re-invite the bot with the required permissions to re-roll a giveaway!`;
        }

        let channel: AnyChannel | null = interaction.guild.channels.cache.get(channelId) ?? null;
        if (!channel) {
            ([, channel] = await dontThrow(interaction.client.channels.fetch(channelId)));
        }

        if (!isText(channel)) {
            return `❌ ${channel} isn't a text or news channel! You can't have a giveaway here.`;
        } else if (!hasPerms(channel, interaction.guild.me, perms)) {
            return `❌ I do not have enough permission to edit the giveaway in ${channel}!`;
        }

        const [fetchMessageError, m] = await dontThrow(channel.messages.fetch(messageId));
        
        if (fetchMessageError !== null) {
            return `❌ Could not fetch the message! Was it deleted? (${inlineCode(fetchMessageError.message)})`;
        } else if (
            !m ||
            m.author.id !== interaction.client.user?.id ||
            m.embeds.length !== 1 ||
            Number(m.embeds[0].timestamp!) > Date.now()
        ) {
            return `❌ This ${hyperlink('message', m?.url ?? 'https://discord.gg')} is not a giveaway.`;
        }
        
        const emoji = m.reactions.resolve('🎉');
        if (m.reactions.cache.size === 0 && emoji) {
            await dontThrow(emoji.users.fetch());
        }

        if (!m.reactions.cache.has('🎉')) {
            return `❌ This message has no 🎉 reactions.`;
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
        } else if (
            count === 1 &&
            users.cache.first()?.id === interaction.client.user.id
        ) { // no one entered
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

        return `✅ Re-rolled the giveaway! [${hyperlink('URL', m.url)}]`;
    }
}