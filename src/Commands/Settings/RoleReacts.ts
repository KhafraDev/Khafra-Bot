import { Command } from "../../Structures/Command";
import { 
    Message, 
    Channel, 
    Role, 
    TextChannel, 
    MessageMentions 
} from "discord.js";
import Embed from "../../Structures/Embed";
import { parse } from "twemoji-parser";
import { pool } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            [
                'GuildSettings: give a user a role when they react to a given message.',
                '[Channel or Channel ID] [@Role or Role ID] [Emoji] [Message Content]',
                '#react_for_role @I_Reacted 👑 Hello, react to this message for a role! :-)'
            ],
            [ 'READ_MESSAGE_HISTORY', 'MANAGE_ROLES', 'ADD_REACTIONS' ],
            {
                name: 'messagereact',
                folder: 'Settings',
                aliases: [ 'messagerole', 'rolereact', 'rolereacts' ],
                cooldown: 5,
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        } else if(args.length < 3) { // messagerole [message id | SEND NEW - channel (ID)] [role] [emoji] [message content if channel]
            return message.channel.send(Embed.missing_args.call(this, 4));
        }

        const [ channel, role, emoji, ...content ] = args;
        // https://discord.com/developers/docs/reference#message-formatting
        if(!/<?#?\d{17,19}>?/.test(channel)) {
            return message.channel.send(Embed.missing_args.call(this, 4));
        } else if(!/<?@?&?\d{17,19}>?/.test(role)) {
            return message.channel.send(Embed.missing_args.call(this, 4));
        } 

        /*** Emoji that will give role */
        const e = parse(emoji).shift()?.text;
        if(e === undefined) {
            return message.channel.send(Embed.missing_args.call(this, 4));
        }

        /** Channel to send message to. */
        let c: Channel;
        try {
            const id = channel.replace(/[^0-9]/g, '');
            c = await message.client.channels.fetch(id);
        } catch {
            return message.channel.send(Embed.fail(`
            No channel could be found!
            \`\`${channel}\`\`
            `));
        }

        const perms = this.permissions.concat('ADD_REACTIONS');
        if(c.type !== 'text') { // only text channels allowed
            return message.channel.send(Embed.fail(`
            Only available for text channels.
            `));
        } else if(!super.hasPermissions(message, c, perms)) { // has permissions in channel
            return message.channel.send(Embed.missing_perms.call(this, false, perms));
        } else if(c.deleted) {
            return message.channel.send(Embed.fail(`
            Congrats! I have no idea how you got this to happen, but the channel is deleted.
            `));
        }

        /** Role to give on reaction */
        const r = MessageMentions.ROLES_PATTERN.test(role) 
            ? message.mentions.roles.first() 
            : await message.guild.roles.fetch(role);
            
        if(!r || !(r instanceof Role)) {
            return message.channel.send(Embed.fail('No role found!'));
        } else if(r.deleted) {
            return message.channel.send(Embed.fail(`
            Congrats! I have no idea how you got this to happen, but the role is deleted.
            `));
        } else if(r.managed) {
            return message.channel.send(Embed.fail(`
            Role is managed by another party.
            `));
        }

        let m: Message;
        try {
            m = await (c as TextChannel).send(Embed.success(content.join(' ')));
            await m.react(e);
        } catch(e) {
            return message.channel.send(Embed.fail(`
            An unexpected error occurred!
            \`\`${e.toString()}\`\`
            `));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        // same channel should be allowed, and a new message cannot have a duplicate Snowflake
        // so no bother checking if they're already inserted
        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { $push: {
                roleReacts: {
                    message:    m.id,
                    role:       r.id,
                    channel:    c.id,
                    emoji:      e
                }
            } },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.channel.send(Embed.success(`
            Sending message to ${c} where ${r} will be given on ${e} reactions!
            `));
        } else {
            return message.channel.send(Embed.fail(`
            Already listening to this message, or an unexpected error occurred!
            `));
        }
    }
}