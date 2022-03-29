import { Command } from '#khaf/Command';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { ActionRow, bold, hyperlink, inlineCode, MessageActionRowComponent, UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { AnyChannel, ButtonInteraction, Message, Snowflake } from 'discord.js';
import { once } from 'events';

const perms = PermissionFlagsBits.SendMessages;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Creates and posts rules for the server.'
            ],
            {
                name: 'rules',
                folder: 'Moderation',
                aliases: ['rule'],
                args: [0, 0],
                guildOnly: true,
                permissions: [PermissionFlagsBits.ManageChannels]
            }
        );
    }

    async init (message: Message<true>): Promise<undefined> {
        const m = await message.reply({
            embeds: [
                Embed.ok()
                    .setDescription(`Please enter the channel where rules should be posted, or click the ${inlineCode('cancel')} button to cancel.`)
                    .setTitle('Rule Editor')
            ],
            components: [
                new ActionRow<MessageActionRowComponent>().addComponents(
                    Components.deny('Cancel', 'cancel')
                )
            ]
        });

        let channel: AnyChannel | null;
        const rules: string[] = [];

        {
            const cancelCollector = m.createMessageComponentCollector({
                max: 1,
                time: 30_000,
                filter: (interaction) =>
                    interaction.user.id === message.author.id &&
                    interaction.customId === 'cancel'
            });
            const channelCollector = m.channel.createMessageCollector({
                max: 1,
                time: 30_000,
                filter: (m) =>
                    m.author.id === message.author.id &&
                    m.mentions.channels.size > 0 ||
                    /\d{17,19}/.test(m.content)
            });

            const race = await Promise.race<Promise<[[Snowflake, ButtonInteraction | Message] | [], string][]>>([
                once(cancelCollector, 'end'),
                once(channelCollector, 'end')
            ]);

            if (!cancelCollector.ended) cancelCollector.stop();
            if (!channelCollector.ended) channelCollector.stop();

            const [coll, reason] = race.shift()!;
            if (coll.length === 0 || reason === 'time') {
                return void dontThrow(m.edit({
                    embeds: [Embed.error('Command was canceled!')],
                    components: disableAll(m)
                }));
            } else if (coll[1] instanceof ButtonInteraction) {
                return void dontThrow(coll[1].update({
                    embeds: [Embed.error('Command was canceled!')],
                    components: disableAll(m)
                }));
            }

            channel =
                coll[1].mentions.channels.first() ??
                await getMentions(coll[1] as Message<true>, 'channels');

            if (!isText(channel)) {
                return void dontThrow(m.edit({
                    embeds: [
                        Embed.error('Channel must be a text channel or a news channel!')
                    ],
                    components: []
                }));
            } else if (!hasPerms(channel, message.guild.me, perms)) {
                return void dontThrow(m.edit({
                    embeds: [
                        Embed.perms(channel, message.guild.me, perms)
                    ],
                    components: []
                }));
            }
        }

        await dontThrow(m.edit({
            embeds: [
                Embed.ok(`
                Send an individual message for each rule, or send them all together. I recommend using ` +
                `${hyperlink('markdown', 'https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-')} ` +
                'to separate messages and make rule titles more noticeable.\n\n' +
                bold('You have to enter each rule within 2.5 minutes or the command will cancel!')
                )
            ],
            components: [
                new ActionRow<MessageActionRowComponent>().addComponents(
                    Components.approve('Finished', 'done'),
                    Components.deny('Cancel', 'cancel')
                )
            ]
        }));

        {
            const buttonCollector = m.createMessageComponentCollector({
                max: 1,
                filter: (interaction) =>
                    interaction.user.id === message.author.id &&
                    interaction.customId === 'cancel' ||
                    interaction.customId === 'done'
            });
            const messageCollector = m.channel.createMessageCollector({
                idle: 60 * 1000 * 2.5,
                filter: (m) =>
                    m.author.id === message.author.id &&
                    m.content.length > 0
            });

            buttonCollector.once('collect', (i) => {
                if (!buttonCollector.ended) buttonCollector.stop();
                if (!messageCollector.ended) messageCollector.stop();

                if (i.customId === 'done' && rules.length === 0) {
                    return void dontThrow(i.update({
                        embeds: [
                            Embed.error('No rules were entered, command was canceled!')
                        ],
                        components: []
                    }));
                } else if (i.customId === 'cancel') {
                    return void dontThrow(i.update({
                        embeds: [
                            Embed.error('Command was canceled!')
                        ],
                        components: []
                    }));
                } else {
                    void dontThrow(i.update({
                        embeds: [
                            Embed.ok(`Posting rules to ${channel} now!`)
                        ],
                        components: disableAll(m)
                    }));
                }
            });

            messageCollector.on('collect', (m) => void rules.push(m.content));

            await once(messageCollector, 'end');
            if (!buttonCollector.ended) buttonCollector.stop();
            if (!messageCollector.ended) messageCollector.stop();

            if (rules.length === 0) {
                return void dontThrow(m.edit({
                    embeds: [
                        Embed.error('No rules were entered, command was canceled!')
                    ],
                    components: []
                }));
            }
        }

        {
            const embeds: UnsafeEmbed[] = [];

            for (const rule of rules) {
                const embed = embeds.at(-1)!;
                const line = rule.endsWith('\n') ? `${rule}\n` : `${rule}\n\n`;

                if (embeds.length === 0) {
                    const embed = Embed.ok(line)
                        .setTitle(`${message.guild.name} Rules`)
                        .setThumbnail(message.guild.iconURL());

                    embeds.push(embed);
                } else if (embed.description!.length >= 2048) {
                    embeds.push(Embed.ok(line));
                } else {
                    const desc = embed.description!;

                    if (desc.length + line.length > 2048) {
                        embeds.push(Embed.ok(line));
                    } else {
                        embed.setDescription(embed.description + line);
                    }
                }
            }

            await dontThrow(channel.send({ embeds }));
        }
    }
}