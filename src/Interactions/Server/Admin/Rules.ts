import { Interactions } from '#khaf/Interaction';
import { chunkSafe } from '#khaf/utility/Array.js';
import { Buttons, Components } from '#khaf/utility/Constants/Components.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { seconds } from '#khaf/utility/ms.js';
import { toString } from '#khaf/utility/Permissions.js';
import { ellipsis, upperCase } from '#khaf/utility/String.js';
import { inlineCode } from '@discordjs/builders';
import {
    ApplicationCommandOptionType,
    ChannelType,
    PermissionFlagsBits,
    TextInputStyle,
    type APIActionRowComponent,
    type APITextInputComponent,
    type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10';
import {
    InteractionCollector,
    type TextInputModalData,
    type ButtonInteraction,
    type ChatInputCommandInteraction,
    type InteractionReplyOptions,
    type ModalSubmitInteraction,
    type NewsChannel,
    type TextChannel
} from 'discord.js';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

const basic = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.ViewChannel
];

const addInput = (action: string, id: string): APIActionRowComponent<APITextInputComponent>[] => {
    const inputs: APIActionRowComponent<APITextInputComponent>[] = [];

    if (action === 'new') {
        inputs.push(
            Components.actionRow([
                Components.textInput({
                    custom_id: `textInput-${id}`,
                    label: `${upperCase(action)} Rule`,
                    style: TextInputStyle.Paragraph,
                    required: true
                })
            ])
        );
    } else if (action === 'edit') {
        inputs.push(
            Components.actionRow([
                Components.textInput({
                    custom_id: `ruleInput-${id}`,
                    label: 'Rule Number',
                    style: TextInputStyle.Short,
                    required: true,
                    placeholder: 'The number of the rule to edit.'
                })
            ]),
            Components.actionRow([
                Components.textInput({
                    custom_id: `textInput-${id}`,
                    label: 'New Text',
                    style: TextInputStyle.Paragraph,
                    required: true
                })
            ])
        );
    } else {
        inputs.push(
            Components.actionRow([
                Components.textInput({
                    custom_id: `ruleInput-${id}`,
                    label: 'Rule Number',
                    style: TextInputStyle.Short,
                    required: true,
                    max_length: 2,
                    min_length: 1,
                    placeholder: 'The number of the rule to remove.'
                })
            ])
        );
    }

    return inputs;
}

const getTextField = (i: ModalSubmitInteraction, name: string): string =>
    (i.fields.getField(name) as TextInputModalData).value;

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'rules',
            description: 'Create, modify, and post an official-looking set of rules!',
            default_member_permissions: toString([PermissionFlagsBits.Administrator]),
            dm_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'channel',
                    description: 'The channel to post the rules to.',
                    required: true,
                    channel_types: [
                        ChannelType.GuildText,
                        ChannelType.GuildNews
                    ]
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
        const defaultPerms = BigInt(this.data.default_member_permissions!);
        const channel = interaction.options.getChannel('channel', true) as NewsChannel | TextChannel;

        if (!interaction.memberPermissions?.has(defaultPerms)) {
            return {
                content: '❌ You do not have permission to use this command!',
                ephemeral: true
            }
        } else if (
            interaction.guild === null ||
            !interaction.guild.members.me ||
            !interaction.guild.members.me.permissions.has(basic)
        ) {
            return {
                content: '❌ I do not have full permissions in this guild, please re-invite me with normal permissions!',
                ephemeral: true
            }
        } else if (!channel.permissionsFor(interaction.guild.members.me).has(basic)) {
            return {
                content: `❌ I do not have permission to send messages in ${channel}!`,
                ephemeral: true
            }
        }

        const id = randomUUID();
        await interaction.reply({
            components: [
                Components.actionRow([
                    Buttons.approve('New Rule', `new-${id}`),
                    Buttons.primary('Edit Rule', `edit-${id}`),
                    Buttons.deny('Delete Rule', `delete-${id}`),
                    Buttons.approve('Post', `post-${id}`),
                    Buttons.secondary('Cancel', `cancel-${id}`)
                ])
            ]
        });

        const rules: string[] = [];
        const c = new InteractionCollector<ButtonInteraction | ModalSubmitInteraction>(interaction.client, {
            idle: 300_000,
            filter: (i) =>
                i.user.id === interaction.user.id &&
                (i.isButton() || i.isModalSubmit()) &&
                i.customId.endsWith(id)
        });

        for await (const [i] of c) {
            const [action] = i.customId.split('-', 1);

            if (i.isButton()) {
                if (action === 'cancel') {
                    c.stop('cancel');

                    await i.reply({
                        content: 'OK, maybe next time! ❤️',
                        ephemeral: true
                    });

                    break;
                } else if (action === 'post') {
                    c.stop();

                    await i.reply({
                        content: `Posting ${rules.length} rules!`,
                        ephemeral: true
                    });

                    break;
                }

                await i.showModal({
                    title: 'Rules',
                    custom_id: `${action}-${id}`,
                    components: addInput(action, id)
                });
            } else {
                const embed = Embed.json({ color: colors.ok });

                if (action === 'new') {
                    if (rules.length === 99) {
                        break;
                    }

                    rules.push(getTextField(i, `textInput-${id}`));
                    embed.title = `Added rule #${rules.length}!`;
                } else if (action === 'edit' || action === 'delete') {
                    const ruleNumber = Number(getTextField(i, `ruleInput-${id}`));

                    if (
                        Number.isNaN(ruleNumber) ||
                        !Number.isInteger(ruleNumber) ||
                        ruleNumber > rules.length ||
                        ruleNumber <= 0
                    ) {
                        embed.title = `Invalid rule #${ruleNumber} - max is #${rules.length}.`;
                    } else if (action === 'edit') {
                        rules.splice(ruleNumber - 1, 1, getTextField(i, `textInput-${id}`));
                        embed.title = `Edit rule #${ruleNumber}!`;
                    } else {
                        rules.splice(ruleNumber - 1, 1);
                        embed.title = `Removed rule #${ruleNumber}!`;
                    }
                }

                embed.description = rules.map(
                    (rule, idx) => `#${idx + 1}: ${inlineCode(ellipsis(rule, 2048 / rules.length - 5))}`
                ).join('\n');

                await i.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
        }

        // Don't post the rules if the user doesn't explicitly choose to,
        // or there aren't any rules to post.
        if (c.endReason === 'idle' || c.endReason === 'cancel' || rules.length === 0) {
            return;
        }

        const embeds = chunkSafe(
            rules.map(
                (rule, idx) => Embed.json({
                    color: colors.ok,
                    title: `Rule ${idx + 1}`,
                    description: rule
                })
            ),
            10
        );

        for (const chunk of embeds) {
            await channel.send({ embeds: chunk });

            await setTimeout(seconds(5));
        }
    }
}