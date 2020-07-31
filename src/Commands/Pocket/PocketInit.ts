import { Command } from "../../Structures/Command";
import { Mongo } from "../../Structures/Database/Mongo";
import { Message, MessageReaction, User } from "discord.js";
import Embed from "../../Structures/Embed";
import { Pocket } from "../../Backend/CommandStructures/Pocket";

export default class extends Command {
    constructor() {
        super(
            'pocketinit',
            [
                'Pocket: Start the process of authorizing your Pocket account.',
                ''
            ],
            [ 'ADD_REACTIONS', 'MANAGE_EMOJIS' ],
            300 // pretty intensive command
        );
    }

    async init(message: Message) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } 

        const client = await Mongo.connect();
        const collection = client.db('khafrabot').collection('pocket');

        const pocket = new Pocket();
        pocket.redirect_uri = `https://discord.com/channels/${message.guild.id}/${message.channel.id}`;

        try {
            await pocket.requestCode()
        } catch(e) {
            return message.channel.send(Embed.fail(`
            An unexpected error occurred!
            
            \`\`\`${(e as Error).toString()}\`\`\`
            `));
        }

        const embed = Embed.success(`
        Authorize Khafra-Bot using the link below! 
        
        [Click Here](${pocket.requestAuthorization})!
        After authorizing react with ✅ to confirm or ❌ to cancel. Command will be canceled after 2 minutes automatically.
        `);

        const msg = await message.channel.send(embed);
        try {
            await msg.react('✅');
            msg.react('❌');
        } catch {} // if it fails, user can add them.

        const filter = (reaction: MessageReaction, user: User) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        const collector = msg.createReactionCollector(filter, { time: 120000, max: 1 });

        await new Promise((resolve, reject) => {
            collector.on('collect', r => {
                const emoji = r.emoji.name;
                collector.stop();

                return emoji === '✅' ? resolve() : reject();
            });
            collector.on('end', () => {
                try {
                    msg.reactions.removeAll();
                } catch {}
            });
        })
        .then(() => pocket.accessToken())
        .catch(e => msg.edit(Embed.fail(`
        Khafra-Bot wasn't authorized.

        \`\`\`${(e as Error).toString()}\`\`\`
        `))); // canceled

        const entry = Object.assign(pocket.toObject(), {
            id: message.author.id
        });

        const value = await collection.updateOne(
            { id: message.author.id },
            { $set: { ...entry } },
            { upsert: true }
        );

        if(value.result.ok) {
            return msg.edit(Embed.success('Your Pocket account has been connected to Khafra-Bot!'))
        } else {
            return msg.edit(Embed.fail('An unexpected error occurred!'));
        }
    }
}