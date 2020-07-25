import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';
import { dbHelpers } from '../../Backend/Helpers/GuildSettings';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'removemessagereact',
            'GuildSettings: stop giving a user a role when reacting to a specific message.',
            [ 'READ_MESSAGE_HISTORY', 'MANAGE_ROLES', 'ADD_REACTIONS' ],
            20,
            [ 'removemessagerole', 'removemessagereact', 
              'deletemessagerole', 'deletemessagereact' ]
        );
    }

    async init(message: Message, args: string[]) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        } else if(args.length < 1) { // removemessagereact [message id]
            return message.channel.send(Embed.missing_args(1, this.name, [
                message.id
            ]));
        }

        const row = dbHelpers.get(message.guild.id);
        if(!row) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        let _message: Message;
        try {
            _message = await message.channel.messages.fetch(args[0]);
        } catch {
            return message.channel.send(Embed.fail('Invalid ID given!'));
        }

        const react_messages = row.react_messages.filter(r => r.id !== _message.id);
        if(react_messages.length === row.react_messages.length) {
            return message.channel.send(Embed.fail('Message isn\'t listening for reactions!'));
        }

        const updated = dbHelpers.updateMessageRoles(
            JSON.stringify(react_messages),
            message.guild.id
        );

        if(updated.changes === 1) {
            return message.channel.send(Embed.success(`
            ${_message.url} will no longer give a role on a reaction!
            `));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }
}