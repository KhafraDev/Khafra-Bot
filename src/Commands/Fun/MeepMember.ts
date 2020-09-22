import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { getMember } from "../../lib/Backend/MeepCraft/MeepCraft";
import { parse } from "url";

export default class extends Command {
    constructor() {
        super(
            [ 
                'Get a MeepCraft forum member. Usernames overtake IDs, so if a given ID is also a username, the member with the username will be found.',
                'cluelessklutz', '5309'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'meepcrafter',
                folder: 'Fun',
                aliases: [ 'meeper' ],
                args: [1, 1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const member = await getMember(args[0]);
        if(member.length === 0) {
            return message.channel.send(this.Embed.fail('No member found!'));
        }

        const real = member.shift();
        const avatar = parse(real.avatar).host ? real.avatar : `https://forum.meepcraft.com/${real.avatar}`;
        const embed = this.Embed.success()
            .setDescription(`
            ${real.username} - ${real.id}
            [Profile Link](https://forum.meepcraft.com/members/.${real.id}/)
            \`\`\`${real.raw.match(/"status">(.*?)<\/blockquote>/)?.[1]?.slice(0, 1000) || 'No status set.'}\`\`\`
            `) // empty string = falsy, not nullish
            .addField('**User Title:**', real.raw.match(/"userTitle">(.*?)<\/h4>/)?.[1] ?? 'Meeper', true)
            .addField('**Last Seen:**', 
                   real.raw.match(/class="DateTime" title="(.*?)">/)?.[1] 
                ?? real.raw.match(/">(.*?)<\/abbr>/)?.[1]
                ?? 'Invalid Date', true)
            .setThumbnail(avatar);

        return message.channel.send(embed);
    }
}