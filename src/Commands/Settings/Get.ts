import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';
import { dbHelpers } from '../../Backend/Helpers/GuildSettings';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'get',
            [
                'GuildSettings: Get the current guild info from the bot.',
                ''
            ],
            [ /* No extra perms needed */ ],
            10
        );
    }

    async init(message: Message) {
        const row = dbHelpers.get(message.guild.id);
        if(!row) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        const owner = await message.client.users.fetch(row.owner_id);
        const embed = Embed.success()
            .addField('**ID:**', row.id, true)
            .addField('**Owner:**', owner, true)
            .addField('\u200B', '\u200B')
            .addField('**Custom Commands:**', row.custom_commands.length, true)
            .addField('**Random Reacts:**', row.reacts.length, true)
            .addField('**React Roles:**', row.react_messages.length, true);

        return message.channel.send(embed);
    }
}