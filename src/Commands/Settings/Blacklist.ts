import { Command } from '../../Structures/Command';
import { 
    Message,  
    TextChannel,  
    User,
    Snowflake
} from 'discord.js';
import { dbHelpers } from '../../lib/Utility/GuildSettings';
import { list } from '../../lib/types/bettersqlite3';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            { name: 'blacklist', folder: 'Settings' },
            [
                'GuildSettings: deny a command to be used in the guild.',
                'cowsay #general', 'optimum @user', 'meepcraft'
            ],
            [ /* No extra perms needed */ ],
            10,
            [ 'denylist', 'deny' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
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
        const blacklistedAlready = row.custom_commands.filter(bl => {
            return bl.name === args[0]     && // command name
                   bl.type === 'blacklist' && // is blacklisted, not whitelisted
                   (bl.users.includes(id) || bl.channels.includes(id) || bl.guild) // id is in channels or users or blacklisted for guild
        }).pop();

        if(blacklistedAlready) {
            return message.channel.send(Embed.fail(`That command is already blacklisted!`));
        }
        
        // command is blacklisted for someone else or another channel
        const exists = row.custom_commands.filter(bl => bl.name === args[0] && bl.type === 'blacklist').pop();
        // all other lists
        const not_existing = row.custom_commands.filter(bl => bl.name !== args[0] && bl.type !== 'blacklist');

        const item: list = {
            name:       exists?.name ?? args[0],
            type:       'blacklist',
            users:      (exists?.users && user ? exists.users.push(id) : [id]) as string[],
            channels:   (exists?.channels && channel ? exists.channels.push(id) : [id]) as string[],
            guild:      id === message.guild.id
        }

        const v = dbHelpers.updateList(
            JSON.stringify(not_existing.concat(item)),
            message.guild.id
        );

        if(v.changes === 1) {
            return message.channel.send(Embed.success('Command has been blacklisted!'));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }
}