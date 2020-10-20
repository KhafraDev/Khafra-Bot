import { Command } from "../../Structures/Command.js";
import { Message, Role, MessageMentions } from "discord.js";
import { pool } from "../../Structures/Database/Mongo.js";
import { KhafraClient } from "../../Bot/KhafraBot.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Set a custom message to give users a role.',
                'give @role',
                'freerole @FreeRole {user}, have a free role!'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'giverole',
                folder: 'Settings',
                args: [2],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms(true));
        }

        if(!/[A-z0-9]/.test(args[0])) {
            return message.channel.send(this.Embed.fail(`Command must have alpha-numeric characters in it!`));
        }

        const c = Array.from(KhafraClient.Commands.values(), d => [d.settings.name, d.settings.aliases ?? [] ].flat()).flat();
        const removeDupes = Array.from(new Set(c));
        if(removeDupes.indexOf(args[0]) > -1) {
            return message.channel.send(this.Embed.fail('Command name is reserved.'));
        }

        const id = args[1].replace(/[^0-9]/g, '');
        const r = MessageMentions.ROLES_PATTERN.test(args[1]) 
            ? message.mentions.roles.first() 
            : await message.guild.roles.fetch(id);

        if(!r || !(r instanceof Role)) {
            return message.channel.send(this.Embed.fail('No role found!'));
        } else if(r.deleted) {
            return message.channel.send(this.Embed.fail(`
            Congrats! I have no idea how you got this to happen, but the role is deleted.
            `));
        } else if(r.managed) {
            return message.channel.send(this.Embed.fail(`
            Role is managed by another party.
            `));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { $and: [
                { id: message.guild.id },
                { 'commandRole.command': {
                    $ne: args[0]
                } }
            ] },
            { $push: {
                commandRole: {
                    role: r.id,
                    command: args[0],
                    message: args.slice(2).length > 0 ? args.slice(2).join(' ').slice(0, 1900) : null
                }
            } },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.channel.send(this.Embed.success(`
            Added custom command \`\`${args[0]}\`\`! It will give ${r} when used (don't forget the prefix)! 
            `));
        } else {
            return message.channel.send(this.Embed.fail('No custom commands were added!'));
        }
    }
}