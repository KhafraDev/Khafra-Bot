import { InteractionSubCommand } from '#khaf/Interaction';
import { isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { validSnowflake } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { plural } from '#khaf/utility/String.js';
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import { bold, hyperlink, inlineCode } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { Channel, ChatInputCommandInteraction, InteractionReplyOptions, User } from 'discord.js';

// TODO(@KhafraDev): do NOT delete the giveaway instantly, allowing time for a giveaway to be re-rolled
// without this shitty code!

const channelsURLReg = /^\/channels\/(?<guildId>\d{17,19})\/(?<channelId>\d{17,19})\/(?<messageId>\d{17,19})\/?$/;
const perms =
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'giveaway',
            name: 'reroll'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const messageURL = URLFactory(interaction.options.getString('url', true));

        if (messageURL === null) {
            return {
                content: '❌ An invalid message link was provided!',
                ephemeral: true
            }
        } else if (
            messageURL.hostname !== 'discord.com' &&
            messageURL.hostname !== 'canary.discord.com' ||
            !channelsURLReg.test(messageURL.pathname)
        ) {
            return {
                content: '❌ The first argument must be a link to a message!',
                ephemeral: true
            }
        }

        const match = channelsURLReg.exec(messageURL.pathname)!.groups!;
        const { guildId, channelId, messageId } = match;

        if (
            !validSnowflake(messageId) ||
            !validSnowflake(channelId) ||
            !validSnowflake(guildId)
        ) {
            return {
                content: '❌ An invalid message link was sent! :(',
                ephemeral: true
            }
        }

        if (guildId !== interaction.guildId || !interaction.guild) {
            return {
                content: '❌ Please re-invite the bot with the required permissions to re-roll a giveaway!',
                ephemeral: true
            }
        }

        let channel: Channel | null = interaction.guild.channels.cache.get(channelId) ?? null;
        if (!channel) {
            ([, channel] = await dontThrow(interaction.client.channels.fetch(channelId)));
        }

        if (!isText(channel)) {
            return {
                content: `❌ ${channel} isn't a text or news channel! You can't have a giveaway here.`,
                ephemeral: true
            }
        } else if (!hasPerms(channel, interaction.guild.members.me, perms)) {
            return {
                content: `❌ I do not have enough permission to edit the giveaway in ${channel}!`,
                ephemeral: true
            }
        }

        const [fetchMessageError, m] = await dontThrow(channel.messages.fetch(messageId));

        if (fetchMessageError !== null) {
            return {
                content: `❌ Could not fetch the message! Was it deleted? (${inlineCode(fetchMessageError.message)})`,
                ephemeral: true
            }
        } else if (
            !m || // eslint-disable-line @typescript-eslint/no-unnecessary-condition
            m.author.id !== interaction.client.user?.id ||
            m.embeds.length !== 1 ||
            Number(m.embeds[0].timestamp!) > Date.now()
        ) {
            return {
                content: '❌ This message is not a giveaway.',
                ephemeral: true
            }
        }

        const emoji = m.reactions.resolve('🎉');
        if (m.reactions.cache.size === 0 && emoji) {
            await dontThrow(emoji.users.fetch());
        }

        if (!m.reactions.cache.has('🎉')) {
            return {
                content: '❌ This message has no 🎉 reactions.',
                ephemeral: true
            }
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

        return {
            content: `✅ Re-rolled the giveaway! [${hyperlink('URL', m.url)}]`,
            ephemeral: true
        }
    }
}