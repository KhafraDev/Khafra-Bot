import { MessageButton } from 'discord.js';

export const Components = {
    approve: (label = 'approve') => new MessageButton()
        .setCustomID('approve')
        .setLabel(label)
        .setStyle('SUCCESS'),
    deny: (label = 'deny') => new MessageButton()
        .setCustomID('deny')
        .setLabel(label)
        .setStyle('DANGER')
}