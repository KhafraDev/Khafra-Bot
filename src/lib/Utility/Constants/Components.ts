import { APIMessage, ButtonStyle } from 'discord-api-types/v9';
import { Message } from 'discord.js';
import { ActionRow, ActionRowComponent, ButtonComponent } from '@khaf/builders';

export const Components = {
    approve: (label = 'approve', id?: string): ButtonComponent => new ButtonComponent()
        .setCustomId(id ?? 'approve')
        .setLabel(label)
        .setStyle(ButtonStyle.Success),
    deny: (label = 'deny', id?: string): ButtonComponent => new ButtonComponent()
        .setCustomId(id ?? 'deny')
        .setLabel(label)
        .setStyle(ButtonStyle.Danger),
    secondary: (label = 'next', id?: string): ButtonComponent => new ButtonComponent()
        .setCustomId(id ?? 'secondary')
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary),
    primary: (label = 'primary', id?: string): ButtonComponent => new ButtonComponent()
        .setCustomId(id ?? 'primary')
        .setLabel(label)
        .setStyle(ButtonStyle.Primary),
    link: (label: string, url: string): ButtonComponent => new ButtonComponent()
        .setLabel(label)
        .setStyle(ButtonStyle.Link)
        .setURL(url)
}

const toggleComponents = (item: Message | APIMessage, disabled: boolean): ActionRow<ActionRowComponent>[] => {
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
        ? item.components as ActionRow<ActionRowComponent>[]
        : item.components.map(r => new ActionRow(r));
}

export const disableAll = (item: Message | APIMessage):
    ActionRow<ActionRowComponent>[] => toggleComponents(item, true);
export const enableAll = (item: Message | APIMessage):
    ActionRow<ActionRowComponent>[] => toggleComponents(item, false);