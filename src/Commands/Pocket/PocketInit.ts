import { Command } from '../../Structures/Command.js';
import { pool } from '../../Structures/Database/Mongo.js';
import { Message, MessageReaction, User, Permissions } from 'discord.js';
import { Pocket } from '../../lib/Backend/Pocket/Pocket.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Pocket: Start the process of authorizing your Pocket account.',
                ''
            ],
			{
                name: 'pocketinit',
                folder: 'Pocket',
                args: [0, 0],
                permissions: [ Permissions.FLAGS.ADD_REACTIONS, Permissions.FLAGS.MANAGE_EMOJIS ]
            }
        );
    }

    async init(message: Message) {
        const client = await pool.pocket.connect();
        const collection = client.db('khafrabot').collection('pocket');

        const pocket = new Pocket();
        pocket.redirect_uri = `https://discord.com/channels/${message.guild.id}/${message.channel.id}`;

        try {
            await pocket.requestCode()
        } catch {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const embed = this.Embed.success(`
        Authorize Khafra-Bot using the link below! 
        
        [Click Here](${pocket.requestAuthorization})!
        After authorizing react with ✅ to confirm or ❌ to cancel. Command will be canceled after 2 minutes automatically.
        `)
        .setTitle('Pocket');

        const msg = await message.reply(embed);
        if(!msg) {
            return;
        }
        await msg.react('✅');
        msg.react('❌');

        const filter = (reaction: MessageReaction, user: User) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        const collector = msg.createReactionCollector(filter, { time: 120000, max: 1 });

        collector.on('collect', async r => {
            const emoji = r.emoji.name;
            collector.stop();

            if(emoji === '❌') {
                return msg.edit(this.Embed.fail('Khafra-Bot wasn\'t authorized.'));
            }

            try {
                await pocket.accessToken();
            } catch {
                return msg.edit(this.Embed.fail('Khafra-Bot wasn\'t authorized.'));
            }

            const entry = Object.assign(pocket.toObject(), {
                id: message.author.id
            });
    
            const value = await collection.updateOne(
                { id: message.author.id },
                { $set: { ...entry } },
                { upsert: true }
            );
    
            if(value.result.ok) {
                return msg.edit(this.Embed.success('Your Pocket account has been connected to Khafra-Bot!'))
            } else {
                return msg.edit(this.Embed.fail('An unexpected error occurred!'));
            }
        });

        collector.on('end', () => {
            try {
                return msg.reactions.removeAll();
            } catch {}
        });
    }
}