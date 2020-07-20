import Command from '../../Structures/Command';
import { Message, GuildMember } from 'discord.js';
import { dbHelpers, reacts } from '../../Helpers/GuildSettings';
import { parse } from 'twemoji-parser';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'randomreact',
            'GuildSettings: react to a given user\'s message with a static emoji.',
            [ 'ADD_REACTIONS', 'READ_MESSAGE_HISTORY' ],
            [ 'react' ]
        );
    }

    async init(message: Message, args: string[]) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        } else if(args.length < 3) { // react [user: @user|ID] [emoji] [chance]
            return message.channel.send(Embed.missing_args(3, this.name, [
                '@user 👑 3\`\` 3% chance to react to @user\'s message.'
            ]));
        }

        const [ user, emoji, chance ] = args;
        const emojis = parse(emoji).pop();

        if(isNaN(+chance)) {
            return message.channel.send(Embed.fail(`
            Received invalid argument type for chance!

            Example:
            \`\`${this.name} @user 👑 3\`\` 3% chance to react to @user's message.
            `));
        } else if(+chance > 5) {
            return message.channel.send(Embed.fail(`Maximum chance allowed is 5% to prevent spamming the API.`))
        } else if(!emojis?.text) {
            return message.channel.send(Embed.fail(`
            ${emoji} is not a valid emoji!
            Due to Discord's API, you must put a backslash (\\\) before the emoji for it to properly work. 

            Example:
            \`\`${this.name} @user 👑 3\`\` 3% chance to react to @user's message.
            `));
        }

        let member: GuildMember;
        if(message.mentions.members.size === 0) {
            try {
                member = await message.guild.members.fetch(user);
            } catch {
                return message.channel.send(Embed.fail(`
                *${user}* is not a valid member!

                Example:
                \`\`${this.name} @user 👑 3\`\` 3% chance to react to @user's message.
                `));
            }
        } else {
            member = message.mentions.members.first();
        }

        const row = dbHelpers.get(message.guild.id);
        if(!row?.reacts) {
            return message.channel.send(Embed.fail(`
            GuildSettings has to be implemented by an administrator!

            Let them know to use the \`\`create\`\` command!
            `));
        }

        if(row.reacts.filter((r: reacts) => r.id === member.id).pop()) {
            return message.channel.send(Embed.fail(`
            ${user} already has a custom emoji!
            `));
        } else if(row.reacts.length >= 10) {
            return message.channel.send(Embed.fail('A maximum of 10 users are allowed to use this command per guild.'));
        }

        row.reacts.push({
            id:     member.id,
            emoji:  emojis.text,
            chance: chance       
        } as reacts);
        
        const updated = dbHelpers.updateReacts(
            JSON.stringify(row.reacts),
            message.guild.id
        );

        if(updated.changes === 1) {
            return message.channel.send(Embed.success(`
            Added ${member} to random reacts!
            Their emoji is ${emojis.text} with a ${chance}% chance.
            `));
        } else {
            return message.channel.send(Embed.fail(`An unexpected error occurred!`));
        }
    }
}