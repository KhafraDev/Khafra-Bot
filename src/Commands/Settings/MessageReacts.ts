import { Command } from '../../Structures/Command';
import { 
    Message, 
    Channel, 
    Role, 
    ReactionEmoji, 
    TextChannel, 
    PermissionString, 
    GuildEmoji 
} from 'discord.js';
import { dbHelpers, react_messages } from '../../Helpers/GuildSettings';
import { parse } from 'twemoji-parser';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'messagereact',
            'GuildSettings: give a user a role when they react to a given message.',
            [ 'READ_MESSAGE_HISTORY', 'MANAGE_ROLES', 'ADD_REACTIONS' ],
            10,
            [ 'messagerole' ]
        );
    }

    async init(message: Message, args: string[]) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        } else if(args.length < 3) { // messagerole [message id | SEND NEW - channel (ID)] [role] [emoji] [message content if channel]
            return message.channel.send(Embed.missing_args(3, this.name, [
                '[Message ID] [@Role or Role ID] [Emoji]',
                '[Channel or Channel ID] [@Role or Role ID] [Emoji] [Message Content]',
                '#react_for_role @I_Reacted 👑 Hello, react to this message for a role! :)'
            ]));
        }

        const row = dbHelpers.get(message.guild.id);
        if(!row) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        const [ id, _role, emoji, ...content ] = args;

        // brace yourself
        // why couldn't they just return null?
        let where: Message | Channel;  
        if(message.mentions.channels.size === 0) {
            try { // try fetching a channel id
                where = await message.client.channels.fetch(id); 
            } catch {}

            if(!where) { // if where is still undefined
                try { // try fetching a message id
                    where = await message.channel.messages.fetch(id);
                } catch {
                    return message.channel.send(Embed.fail('Invalid ID or mention.'))
                }
            }
        } else {
            where = message.mentions.channels.first();
        }

        // Check if the channel type is text (if it's a channel)
        // or check if there is content for a new message.
        if(where instanceof Channel) {
            if(where.type !== 'text') {
                return message.channel.send(Embed.fail('Only text channels are allowed.'));
            } else if(content.length === 0) {
                return message.channel.send(Embed.fail('A message must be provided for new messages!'));
            }
        }

        const whereChannel = where instanceof Channel ? (where as TextChannel) : (where.channel as TextChannel);
        const wherePerms = whereChannel.permissionsFor(message.guild.me);
        const permsNeeded = [ 'SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS', 'MANAGE_ROLES', 'READ_MESSAGE_HISTORY' ] as PermissionString[];
        if(!permsNeeded.every(perm => wherePerms.has(perm))) {
            return message.channel.send(Embed.fail(`
            I am lacking \`\`${permsNeeded.join(', ')}\`\` permission(s) in ${whereChannel}!
            `));
        } 

        let role: Role;
        if(message.mentions.roles.size === 0) {
            try {
                role = await message.guild.roles.fetch(_role);
            } catch {
                return message.channel.send(Embed.fail('Invalid role or role ID.'));
            }
        } else {
            role = message.mentions.roles.first();
        }

        let Emoji: ReactionEmoji | GuildEmoji; // unicode emoji or guild emoji id
        const parsed = parse(emoji);
        if(parsed.length > 0) {
            Emoji = parsed.pop().text as unknown as ReactionEmoji;
        } else {
            const match = emoji.match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/)?.[3]; // from discord.js server
            try {
                Emoji = message.guild.emojis.resolve(match ?? emoji); //.id;
            } catch {
                return message.channel.send(Embed.fail('Invalid emoji or emoji ID.'));
            }
        }

        let sent_id: string;
        if(where instanceof Channel) {
            const messageSent = await whereChannel.send(Embed.success(content.join(' ')));
            await messageSent.react(Emoji);
            
            sent_id = messageSent.id;
        } else {
            where.react(Emoji);
        }

        const react_messages = [].concat(row.react_messages, {
            id: where instanceof Message ? where.id : sent_id,
            content: content.join(' '),
            emoji: Emoji.id ?? Emoji.name ?? Emoji,
            role: role.id
        } as react_messages);

        const updated = dbHelpers.updateMessageRoles(
            JSON.stringify(react_messages),
            message.guild.id
        );

        if(updated.changes === 1) {
            if(where instanceof Message) {
                return message.channel.send(Embed.success(`
                Listening for reactions on 
                ${where.url} 
                where ${role} will be given on ${Emoji} reactions!
                `));
            } else {
                return message.channel.send(Embed.success(`
                Sending message to ${whereChannel} where ${role} will be given on ${Emoji} reactions!
                `));
            }
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }
}