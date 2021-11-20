import { Command } from '../../../Structures/Command.js';
import { isText, isThread, Message } from '../../../lib/types/Discord.js.js';
import { MessageActionRow, Permissions, TextBasedChannels } from 'discord.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { inlineCode } from '@khaf/builders';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { ellipsis } from '../../../lib/Utility/String.js';
import { setTimeout } from 'timers/promises';

interface Settings {
    channel: TextBasedChannels | null
    options: string[]
}

enum Actions {
    ADD = 'add',
    POST = 'post',
    CHANNEL = 'channel',
    CANCEL = 'cancel'
}

const emojis = [
    '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣',
	'6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'
] as const;
const perms = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS
]);

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Create a poll in a channel.', 
                '705894525473784303'
            ],
			{
                name: 'poll',
                folder: 'Server',
                args: [0, 0],
                ratelimit: 30,
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        // the current option the user is setting
        let currentOption: `${Actions}` | null = null;
        const settings: Settings = {
            channel: null,
            options: []
        };
 
        const m = await message.reply({
            embeds: [
                this.Embed.success(`
                Press a button below to make selections:
                • ${inlineCode('Add Option')}: Once pressing, type the option in chat to add it (cut off after 200 characters).
                • ${inlineCode('Post Poll')}: Posts the poll to the selected channel.
                • ${inlineCode('Add Channel')}: Once pressing, mention the channel to post the poll to.
                • ${inlineCode('Cancel')}: Cancels the current creation.
                `)
            ],
            components: [
                new MessageActionRow().addComponents(
                    Components.approve('Add Option', Actions.ADD),
                    Components.primary('Post Poll', Actions.POST),
                    Components.secondary('Add Channel', Actions.CHANNEL),
                    Components.deny('Cancel', Actions.CANCEL)
                )
            ]
        });

        const interactionCollector = m.createMessageComponentCollector({
            filter: (interaction) => 
                interaction.user.id === message.author.id &&
                currentOption === null,
            idle: 60_000,
            max: 10
        });

        const messageCollector = m.channel.createMessageCollector({
            filter: (mm) =>
                mm.author.id === message.author.id &&
                currentOption !== null &&
                !m.deleted,
            time: 60_000 * 5,
            max: 10
        });

        interactionCollector.on('collect', async (i) => {
            currentOption = i.customId as `${Actions}`;

            if (currentOption === Actions.POST) {
                if (settings.channel === null || settings.options.length === 0) {
                    return void dontThrow(m.edit({
                        content: `No channel or options were present. Canceled the poll creation!`,
                        embeds: [],
                        components: disableAll(m)
                    }));
                }

                const embed = this.Embed.success()
                    .setTitle('Poll')
                    .setAuthor(message.author.username, message.author.displayAvatarURL());

                for (let i = 0; i < settings.options.length; i++) {
                    const option = settings.options[i];
                    const emoji = emojis[i];
                    
                    embed.description ??= '';
                    embed.description += `${emoji}. ${option}\n`;
                }

                const [err, pollMessage] = await dontThrow(settings.channel.send({
                    embeds: [embed]
                }));

                if (err === null) {
                    const prs = settings.options.reduce((a, _b, i) => {
                        a.push(pollMessage.react(emojis[i]));
                        a.push(setTimeout(1500));
                        return a;
                    }, [] as Promise<unknown>[]);
                    void Promise.allSettled(prs);
                }
            }

            void dontThrow(i.update({}));
        });

        messageCollector.on('collect', async (msg) => {
            if (currentOption === Actions.CANCEL) {
                return messageCollector.stop();
            } else if (currentOption === Actions.CHANNEL) {
                const channel = await getMentions(msg, 'channels', { idx: 0 });

                if (!isText(channel) && !isThread(channel)) {
                    return void dontThrow(m.edit({
                        content: `Only text, news, and thread channels are allowed to be poll channels!`
                    }));
                } else if (!hasPerms(channel, message.guild.me, perms)) {
                    return void dontThrow(m.edit({
                        content: `I don't have enough permissions to create a poll in this channel!`
                    }));
                }

                settings.channel = channel;
                await dontThrow(m.edit({
                    content: `The poll channel is now set to ${channel}!`
                }));
                currentOption = null;
            } else if (currentOption === Actions.ADD) {
                const option = ellipsis(msg.content, 200);
                settings.options.push(option);
                await dontThrow(m.edit({
                    content: `${inlineCode(option)} has been added as a poll option!`
                }));
                currentOption = null;
            }
        });

        const end = () => {
            if (!interactionCollector.ended) interactionCollector.stop();
            if (!messageCollector.ended) messageCollector.stop();

            return void dontThrow(m.edit({
                embeds: [],
                content: `Poll creation canceled!`,
                components: disableAll(m)
            }))
        }

        interactionCollector.on('end', end);
        messageCollector.on('end', end);
    }
}