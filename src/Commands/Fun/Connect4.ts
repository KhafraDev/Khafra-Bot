import { Command } from "../../Structures/Command.js";
import { Message, User, MessageReaction } from "discord.js";
import { Connect4 } from "../../lib/Backend/Connect4/Connect4.js";

const turns = {
    1: '1️⃣', 
    2: '2️⃣', 
    3: '3️⃣', 
    4: '4️⃣', 
    5: '5️⃣', 
    6: '6️⃣', 
    7: '7️⃣'
};

export default class extends Command {
    constructor() {
        super(
            [
                'Play a game of Connect 4!',
                '@Khafra#0001'
            ],
            [ 'ADD_REACTIONS' ],
            { 
                name: 'connect4', 
                folder: 'Fun',
                args: [1, 1],
                guildOnly: true
            },
        );
    }

    async init(message: Message) {
        if(message.mentions.members.size === 0) {
            return message.channel.send(this.Embed.fail('No opponent to play against!'));
        } else if(message.mentions.members.size > 2) {
            return message.channel.send(this.Embed.fail('Too many people mentioned!'));
        }

        const selfMentioned = new RegExp(`<@!?${message.guild.me.id}>`).test(message.content.split(/\s+/g).shift());
        // gets the last mentioned if the command was initialized by mentioning it
        // only works in guilds so message.guild is always defined.
        const opponent = selfMentioned ? message.mentions.members.last() : message.mentions.members.first();
        const game = new Connect4();
        
        const embed = this.Embed.success()
            .setTitle('Connect 4')
            .setDescription(`
            It is ${message.author}'s (${game.turn}) turn!
            ${game.format()}
            `);

        const game_msg = await message.channel.send(embed);
        if(!game_msg) {
            return;
        }
        
        const filter = (reaction: MessageReaction, user: User) => 
            (user.id === opponent.id || user.id === message.author.id) &&
            Object.values(turns).includes(reaction.emoji.name)
        ;

        for(const emoji of Object.values(turns)) {
            await game_msg.react(emoji);
        }

        const collector = game_msg.createReactionCollector(filter, { time: 180000 });

        collector.on('collect', async collected => {
            if(!game_msg || game_msg.deleted) {
                return collector.stop();
            }

            const user = collected.users.cache.last();
            if(
                (user.id === message.author.id && game.turn !== 'red') ||
                (user.id === opponent.id && game.turn !== 'white')
            ) {
                return;
            }

            const pos = Object.entries(turns)
                .filter(([, v]) => v === collected.emoji.name)
                .pop();

            if(!pos) {
                return;
            }

            game.go(+pos[0] - 1);
            const embed = this.Embed.success()
            .setDescription(`
            It is ${game.turn === 'red' ? user : opponent}'s (${game.turn}) turn!
            ${game.format()}
            `);

            await game_msg.edit(embed);
        });
    }
}