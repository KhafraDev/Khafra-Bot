import Command from '../../Structures/Command';
import { Message, MessageEmbed } from 'discord.js';
import { dbHelpers } from '../../Structures/GuildSettings/GuildSettings';

export default class extends Command {
    constructor() {
        super(
            'get',
            'Get the current guild info from the bot.',
            [ 'SEND_MESSAGES', 'EMBED_LINKS' ]
        );
    }

    async init(message: Message) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            `));
        }

        const row = dbHelpers.get(message.guild.id);
        if(!row) {
            return message.channel.send(this.failEmbed(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        return message.channel.send(await this.formatEmbed(row, message));
    }

    async formatEmbed(row: any, message: Message): Promise<MessageEmbed> {
        const owner = await message.client.users.fetch(row.owner_id);
        const embed = new MessageEmbed()
            .addField('**ID:**', row.id, true)
            .addField('**Owner:**', owner, true)
            .addField('\u200B', '\u200B')
            .addField('**Custom Commands:**', JSON.parse(row.custom_commands).length, true)
            .addField('**Random Reacts:**', Object.keys(JSON.parse(row.reacts)).length, true)
            .addField('**React Roles:**', Object.keys(JSON.parse(row.react_messages)).length, true)
            
        return embed;
    }
}