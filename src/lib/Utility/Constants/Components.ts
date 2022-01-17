import { Message, MessageActionRow, MessageButton } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';

export const Components = {
    approve: (label = 'approve', id?: string) => new MessageButton()
        .setCustomId(id ?? 'approve')
        .setLabel(label)
        .setStyle('SUCCESS'),
    deny: (label = 'deny', id?: string) => new MessageButton()
        .setCustomId(id ?? 'deny')
        .setLabel(label)
        .setStyle('DANGER'),
    secondary: (label = 'next', id?: string) => new MessageButton()
        .setCustomId(id ?? 'secondary')
        .setLabel(label)
        .setStyle('SECONDARY'),
    primary: (label = 'primary', id?: string) => new MessageButton()
        .setCustomId(id ?? 'primary')
        .setLabel(label)
        .setStyle('PRIMARY')
}

const toggleComponents = (item: Message | APIMessage, disabled: boolean) => {
    if (!item.components) return [];
    
    for (const component of item.components) {
        for (const button of component.components) {
            button.disabled = disabled;
        }
    }

    return 'channelId' in item
        ? item.components
        : item.components.map(r => new MessageActionRow(r));
}

export const disableAll = (item: Message | APIMessage) => toggleComponents(item, true);
export const enableAll = (item: Message | APIMessage) => toggleComponents(item, false);