import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            [
                'See reviews for the worst ISP in the U.S.',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'optimum',
                folder: 'Fun',
                aliases: [ 'altice' ],
                args: [0, 0]
            }
        );
    }

    init(message: Message) {
        const embed = this.Embed.success()
            .setTitle('Optimum by Altice')
            .setDescription(`
            Reviews by *real* people:

            [Consumer Affairs](https://www.consumeraffairs.com/cable_tv/optimum.html) - 1 ⭐
            [Moneysavingpro](https://www.moneysavingpro.com/internet-providers/optimum-reviews/) - 2 ⭐
            [Yelp](https://www.yelp.com/biz/optimum-cable-cablevision-brooklyn) - 1 ⭐
            [BestCompany](https://bestcompany.com/isp/company/optimum-online) - 2 ⭐
            [EMPLOYEE REVIEWS](https://www.indeed.com/cmp/Optimum-Cablevision/reviews) - 3.2 ⭐
            [SiteJabber](https://www.sitejabber.com/reviews/optimum.com) - 1 ⭐
            [ServiceReview users](https://servicereviews.org/review/optimum-internet/) - 1.4 ⭐
            `);

        return message.reply(embed);
    }
}