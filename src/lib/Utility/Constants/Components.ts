import { type APIMessage, ButtonStyle } from 'discord-api-types/v10';
import type { Message } from 'discord.js';
import { ActionRow, type MessageActionRowComponent, UnsafeButtonComponent } from '@discordjs/builders';

export const Components = {
    approve: (label = 'approve', id?: string): UnsafeButtonComponent => new UnsafeButtonComponent()
        .setCustomId(id ?? 'approve')
        .setLabel(label)
        .setStyle(ButtonStyle.Success),
    deny: (label = 'deny', id?: string): UnsafeButtonComponent => new UnsafeButtonComponent()
        .setCustomId(id ?? 'deny')
        .setLabel(label)
        .setStyle(ButtonStyle.Danger),
    secondary: (label = 'next', id?: string): UnsafeButtonComponent => new UnsafeButtonComponent()
        .setCustomId(id ?? 'secondary')
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary),
    primary: (label = 'primary', id?: string): UnsafeButtonComponent => new UnsafeButtonComponent()
        .setCustomId(id ?? 'primary')
        .setLabel(label)
        .setStyle(ButtonStyle.Primary),
    link: (label: string, url: string): UnsafeButtonComponent => new UnsafeButtonComponent()
        .setLabel(label)
        .setStyle(ButtonStyle.Link)
        .setURL(url)
}

const toggleComponents = (item: Message | APIMessage, disabled: boolean): ActionRow<MessageActionRowComponent>[] => {
    if (!item.components) return [];

    for (const component of item.components) {
        for (const button of component.components) {
            if ('setDisabled' in button) {
                button.setDisabled(disabled);
            } else {
                button.disabled = disabled;
            }
        }
    }

    return 'channelId' in item
        ? item.components as ActionRow<MessageActionRowComponent>[]
        : item.components.map(r => new ActionRow(r));
}

export const disableAll = (item: Message | APIMessage):
    ActionRow<MessageActionRowComponent>[] => toggleComponents(item, true);
export const enableAll = (item: Message | APIMessage):
    ActionRow<MessageActionRowComponent>[] => toggleComponents(item, false);