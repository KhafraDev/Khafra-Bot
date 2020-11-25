import { Command } from '../../Structures/Command.js';
import { 
    Message, 
    Role,  
    TextChannel, 
    Channel,
    MessageMentions,
    Permissions
} from 'discord.js';
import twemoji from "twemoji-parser"; // cjs module
import { pool } from '../../Structures/Database/Mongo.js';

export default class extends Command {
    constructor() {
        super(
            [
                'GuildSettings: give a user a role when they react to a **pre-existing** message.',
                '[Message ID] [Channel or Channel ID] [@Role or Role ID] [Emoji]',
                '739301857226129528 #react_for_role @I_Reacted 👑'
            ],
			{
                name: 'messagereactmessage',
                folder: 'Settings',
                args: [4, 4],
                guildOnly: true,
                permissions: [ 
                    Permissions.FLAGS.READ_MESSAGE_HISTORY, 
                    Permissions.FLAGS.MANAGE_ROLES, 
                    Permissions.FLAGS.ADD_REACTIONS 
                ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        }

        const [ messageID, channel, role, emoji ] = args;
        if(!/\d{17,19}/.test(messageID)) {
            return message.reply(this.Embed.generic());
        } else if(!/<?#?\d{17,19}>?/.test(channel)) {
            return message.reply(this.Embed.generic());
        } else if(!/<?@?&?\d{17,19}>?/.test(role)) {
            return message.reply(this.Embed.generic());
        } 

        /** Channel where message is. */
        let c: Channel;
        try {
            const id = channel.replace(/[^0-9]/g, '');
            c = await message.client.channels.fetch(id);
        } catch {
            return message.reply(this.Embed.fail(`
            No channel could be found!
            \`\`${channel}\`\`
            `));
        }

        const perms = this.permissions.concat(Permissions.FLAGS.ADD_REACTIONS);
        if(c.type !== 'text') { // only text channels allowed
            return message.reply(this.Embed.fail(`
            Only available for text channels.
            `));
        } else if(!super.hasPermissions(message, c, perms)) { // has permissions in channel
            return message.reply(this.Embed.missing_perms(true, perms));
        } else if(c.deleted) {
            return message.reply(this.Embed.fail(`
            Congrats! I have no idea how you got this to happen, but the channel is deleted.
            `));
        }

        /*** Emoji that will give role */
        const e = twemoji.parse(emoji).shift()?.text;
        if(e === undefined) {
            return message.reply(this.Embed.generic());
        }

        /** Role to give on reaction */
        const r = MessageMentions.ROLES_PATTERN.test(role) 
            ? message.mentions.roles.first() 
            : await message.guild.roles.fetch(role);

        if(!r || !(r instanceof Role)) {
            return message.reply(this.Embed.fail('No role found!'));
        } else if(r.deleted) {
            return message.reply(this.Embed.fail(`
            Congrats! I have no idea how you got this to happen, but the role is deleted.
            `));
        } else if(r.managed) {
            return message.reply(this.Embed.fail(`
            Role is managed by another party.
            `));
        }

        let m: Message;
        try {
            m = await (c as TextChannel).messages.fetch(messageID);
        } catch {
            return message.reply(this.Embed.fail(`
            No message with id ${messageID} found in ${c}!
            `));
        }   

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { $and: [
                { id: message.guild.id },
                { 'roleReacts.message': { $ne: m.id } }
            ] },
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
            return message.reply(this.Embed.success(`
            Listening for ${e} reactions on ${m.url} (${c}). 
            When reacted, ${r} will be given to the user.
            `));
        } else {
            return message.reply(this.Embed.fail(`
            Already listening to this message, or an unexpected error occurred!
            `));
        }
    }
}