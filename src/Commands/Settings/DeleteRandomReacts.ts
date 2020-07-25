import { Command } from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
import { dbHelpers } from '../../Backend/Helpers/GuildSettings';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'removerandomreact',
            'GuildSettings: remove user\'s chance of message being reacted to.',
            [ 'ADD_REACTIONS', 'READ_MESSAGE_HISTORY' ],
            20,
            [ 'removereact', 'removerandomreacts', 'removereacts',
              'deletereact', 'deleterandomreacts', 'deletereacts'  ]
        );
    }

    async init(message: Message, args: string[]) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        } else if(args.length < 1) { // removereact [user]
            return message.channel.send(Embed.missing_args(1, this.name, [
                message.member.toString(),
                message.client.user.id
            ]));
        } 

        const row = dbHelpers.get(message.guild.id);
        if(!row) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        let member: GuildMember = message.mentions.members.first();
        try {
            if(!member) {
                member = await message.guild.members.fetch(args[0]);
            }
        } catch {
            return message.channel.send(Embed.fail('Invalid user!'));
        }

        const filtered = row.reacts.filter(r => r.id !== member.id);
        if(filtered.length === row.reacts.length) { // nothing was filtered out
            return message.channel.send(Embed.fail(`${member} doesn't have a random react!`));
        }

        const updated = dbHelpers.updateReacts(
            JSON.stringify(filtered),
            message.guild.id
        );

        if(updated.changes === 1) {
            return message.channel.send(Embed.success(`Removed ${member} from random reacts!`));
        } else {
            return message.channel.send(Embed.fail(`An unexpected error occurred!`));
        }
    }
}