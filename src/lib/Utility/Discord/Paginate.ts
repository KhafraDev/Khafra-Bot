import { InteractionCollector, Message, MessageComponentInteraction, MessageEmbed } from 'discord.js';
import { disableAll } from '#khaf/utility/Constants/Components.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';

export const Paginate = (
    c: InteractionCollector<MessageComponentInteraction>, 
    m: Message, 
    pageData: number,
    embeds: MessageEmbed[] | ((page: number) => MessageEmbed)
) => {
    let page = 0;

    c.on('collect', i => {
        if (i.customId === 'deny' || c.total >= pageData) {
            return c.stop();
        }

        i.customId === 'approve' ? page++ : page--;

        if (page < 0) page = pageData - 1;
        if (page >= pageData) page = 0;

        const embed = Array.isArray(embeds) ? embeds[page] : embeds(page);

        return void dontThrow(i.update({
            embeds: [embed]
        }));
    });

    c.once('end', (i) => {
        if (i.size === 0 || i.last()!.replied) {
            return void dontThrow(m.edit({
                components: disableAll(m)
            }));
        }

        if (i.last()!.replied) return; 
        
        return void dontThrow(i.last()!.update({
            components: disableAll(m)
        }));
    })
}