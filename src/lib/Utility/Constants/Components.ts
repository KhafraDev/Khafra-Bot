import { MessageButton } from 'discord.js';

export const Components = {
    approve: (label = 'approve', id?: string) => new MessageButton()
        .setCustomID(id ?? 'approve')
        .setLabel(label)
        .setStyle('SUCCESS'),
    deny: (label = 'deny', id?: string) => new MessageButton()
        .setCustomID(id ?? 'deny')
        .setLabel(label)
        .setStyle('DANGER'),
    secondary: (label = 'next', id?: string) => new MessageButton()
        .setCustomID(id ?? 'secondary')
        .setLabel(label)
        .setStyle('SECONDARY'),
    primary: (label = 'primary', id?: string) => new MessageButton()
        .setCustomID(id ?? 'primary')
        .setLabel(label)
        .setStyle('PRIMARY')
}