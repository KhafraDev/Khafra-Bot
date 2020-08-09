import { Command } from '../../Structures/Command';
import { 
    Message,  
    TextChannel,  
    User,
    Snowflake
} from 'discord.js';
import { dbHelpers } from '../../Backend/Utility/GuildSettings';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            { name: 'removeblacklist', folder: 'Settings' },
            [
                'GuildSettings: allow a user/channel/guild to use a blacklisted command again.',
                'cowsay #general', 'optimum @user', 'meepcraft'
            ],
            [ /* No extra perms needed */ ],
            10,
            [ 'removedenylist', 'removedeny', 'unblacklist' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name.name, this.help.slice(1)));
        }

        const row = dbHelpers.get(message.guild.id, 'custom_commands');
        if(!row) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        let user: User;
        let channel: TextChannel;
        let id: Snowflake;

        if(message.mentions.members.size > 0) {
            user = message.mentions.members.first().user;
        } else if(message.mentions.channels.size > 0) {
            channel = message.mentions.channels.first();
        } else {
            try {
                user = await message.client.users.fetch(args[1]);
            } catch {}

            if(!user && !channel) {
                try {
                    channel = await message.client.channels.fetch(args[1]) as TextChannel;
                } catch {
                    id = message.guild.id;
                }
            }
        }

        id = id ?? user?.id ?? channel.id;
        const items = row.custom_commands.filter(bl => {
            return bl.name === args[0].toLowerCase()
            && bl.type === 'blacklist'
            && (!bl.users.includes(id) && !bl.channels.includes(id) && !bl.guild)
        });

        if(items.length === row.custom_commands.length) {
            return message.channel.send(Embed.fail('Command isn\'t blacklisted for user/channel/guild!'));
        }

        const v = dbHelpers.updateList(
            JSON.stringify(items),
            message.guild.id
        );

        if(v.changes === 1) {
            return message.channel.send(Embed.success('Command has been un-blacklisted!'));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }
}