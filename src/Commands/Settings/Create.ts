import Command from '../../Structures/Command';
import { dbHelpers } from '../../Helpers/GuildSettings';
import { Message } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'create',
            'Adds the guild to server settings.',
            [ 'SEND_MESSAGES', 'EMBED_LINKS' ],
            [ 'add' ]
        );
    }

    async init(message: Message) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        } else if(dbHelpers.isCached(message.guild.id)) {
            return message.channel.send(Embed.fail('Guild has already been inserted into database and cached!'));
        }

        const value = dbHelpers.set(message);
        if(value.changes === 1) {
            return message.channel.send(Embed.success('Guild settings are now available for you to use!'));
        } else if(value.changes === 0) {
            return message.channel.send(Embed.fail('Guild has already been inserted into database!'));
        }

        return message.channel.send(Embed.fail('An unknown error occurred!'))
    }
}