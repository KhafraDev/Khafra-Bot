import { type APIMessage, ButtonStyle, ComponentType } from 'discord-api-types/v10';
import type { Message } from 'discord.js';
import { ActionRowBuilder, type MessageActionRowComponentBuilder, UnsafeButtonBuilder } from '@discordjs/builders';

export const Components = {
    approve: (label = 'approve', id?: string): UnsafeButtonBuilder => new UnsafeButtonBuilder()
        .setCustomId(id ?? 'approve')
        .setLabel(label)
        .setStyle(ButtonStyle.Success),
    deny: (label = 'deny', id?: string): UnsafeButtonBuilder => new UnsafeButtonBuilder()
        .setCustomId(id ?? 'deny')
        .setLabel(label)
        .setStyle(ButtonStyle.Danger),
    secondary: (label = 'next', id?: string): UnsafeButtonBuilder => new UnsafeButtonBuilder()
        .setCustomId(id ?? 'secondary')
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary),
    primary: (label = 'primary', id?: string): UnsafeButtonBuilder => new UnsafeButtonBuilder()
        .setCustomId(id ?? 'primary')
        .setLabel(label)
        .setStyle(ButtonStyle.Primary),
    link: (label: string, url: string): UnsafeButtonBuilder => new UnsafeButtonBuilder()
        .setLabel(label)
        .setStyle(ButtonStyle.Link)
        .setURL(url)
}

const toggleComponents = (item: Message | APIMessage, disabled: boolean): ActionRowBuilder<MessageActionRowComponentBuilder>[] => {
    if (!item.components) return [];

    const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

    for (const { components } of item.components) {
        const newRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();
        for (const button of components) {
            if (button.type === ComponentType.SelectMenu) continue;

            const rawButton = 'toJSON' in button ? button.toJSON() : button;
            rawButton.disabled = disabled;

            newRow.addComponents(new UnsafeButtonBuilder(rawButton));
        }

        rows.push(newRow);
    }

    return rows;
}

export const disableAll = (item: Message | APIMessage):
    ActionRowBuilder<MessageActionRowComponentBuilder>[] => toggleComponents(item, true);
export const enableAll = (item: Message | APIMessage):
    ActionRowBuilder<MessageActionRowComponentBuilder>[] => toggleComponents(item, false);