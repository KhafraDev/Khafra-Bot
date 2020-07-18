import Command from '../../Structures/Command';
import { dbHelpers } from '../../Structures/GuildSettings/GuildSettings';
import { Message, MessageEmbed } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            'create',
            'Adds the guild to server settings.',
            [ 'SEND_MESSAGES', 'EMBED_LINKS' ],
            [ 'add' ]
        );
    }

    async init(message: Message): Promise<any> {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            You must have \`\`ADMINISTRATOR\`\` perms to use this command!
            `));
        } else if(dbHelpers.isCached(message.guild.id)) {
            return message.channel.send(this.failEmbed('Guild has already been inserted into database and cached!'));
        }

        const value = dbHelpers.set(message);
        if(value.changes === 1) {
            return message.channel.send(this.formatEmbed());
        } else if(value.changes === 0) {
            return message.channel.send(this.failEmbed('Guild has already been inserted into database!'));
        }

        return message.channel.send(this.failEmbed('An unknown error occurred!'))
    }

    formatEmbed(): MessageEmbed {
        const embed = new MessageEmbed()
            .setDescription('Guild settings are now available for you to use!');

        return embed;
    }
}