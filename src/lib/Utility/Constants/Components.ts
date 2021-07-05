import { Message, MessageButton } from 'discord.js';

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

type Component = { components: Message['components'] }

export const disableAll = ({ components }: Component) => {
    for (const component of components) {
        for (const button of component.components) {
            button.setDisabled(true);
        }
    }

    return components;
}