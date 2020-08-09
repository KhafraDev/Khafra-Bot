import { Command } from '../../Structures/Command';
import { 
    Message, 
    Role, 
    ReactionEmoji, 
    TextChannel, 
    GuildEmoji 
} from 'discord.js';
import { dbHelpers } from '../../Backend/Utility/GuildSettings';
import { react_messages } from '../../Backend/types/bettersqlite3';
import { parse } from 'twemoji-parser';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            { name: 'messagereactmessage', folder: 'Settings' },
            [
                'GuildSettings: give a user a role when they react to a pre-existing message.',
                '[Message ID] [Channel or Channel ID] [@Role or Role ID] [Emoji] [Message Content]',
                '739301857226129528 #react_for_role @I_Reacted 👑 Hello, react to this message for a role! :)'
            ],
            [ 'READ_MESSAGE_HISTORY', 'MANAGE_ROLES', 'ADD_REACTIONS' ],
            10,
            [ 'messagerolemessage', 'rolereactmessage', 'rolereactsmessage',
              'messagereactm', 'messagerolem', 'rolereactm', 'rolereactsm',
              'messagereactmsg', 'messagerolemsg', 'rolereactmsg', 'rolereactsmsg']
        );
    }

    async init(message: Message, args: string[]) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        } else if(args.length < 4) {
            return message.channel.send(Embed.missing_args(4, this.name.name, this.help.slice(1)));
        }

        const row = dbHelpers.get(message.guild.id, 'react_messages');
        if(!row) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        const [ messageID, channel, _role, emoji ] = args;

        let where: TextChannel = message.mentions.channels.first();  
        if(!where) { // no channels mentioned
            try { // try fetching a channel id
                where = await message.client.channels.fetch(channel) as TextChannel; 
                if(where.type !== 'text') {
                    return message.channel.send(Embed.fail('Non-TextChannel mentioned!'));
                }
            } catch {
                return message.channel.send(Embed.fail(`
                No channel mentioned and an invalid ID was provided!

                If you want to use this command on a pre-existing message, use \`\`messagereactmsg\`\`!
                `));
            }
        }
        
        if(!super.hasPermissions(
            message, 
            where, 
            [ 'SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS', 'MANAGE_ROLES', 'READ_MESSAGE_HISTORY' ])
        ) {
            return message.channel.send(Embed.missing_perms(
                [ 'SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS', 'MANAGE_ROLES', 'READ_MESSAGE_HISTORY' ],
                true
            ));
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

        let msg: Message;
        try {
            msg = await where.messages.fetch(messageID);
        } catch {
            return message.channel.send(Embed.fail('Message couldn\'t be fetched from ' + where.toString() + '!'));
        }   

        const react_messages: react_messages[] = [].concat(row.react_messages, {
            id: msg.id,
            emoji: Emoji.id ?? Emoji.name ?? Emoji,
            role: role.id
        } as react_messages);

        const updated = dbHelpers.updateMessageRoles(
            JSON.stringify(react_messages),
            message.guild.id
        );

        if(updated.changes === 1) {
            return message.channel.send(Embed.success(`
            Listening for ${Emoji} reactions on ${msg.url} where ${role} will be given!
            `));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }
}