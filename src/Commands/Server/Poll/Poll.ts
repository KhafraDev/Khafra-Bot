import { Command } from "../../../Structures/Command.js";
import { Message, TextChannel, PermissionString } from "discord.js";
import twemoji from "twemoji-parser"; // cjs module

export default class extends Command {
    constructor() {
        super(
            [
                'Poll', 
                `705894525473784303 👍 👎
"Option 1: Yes
Option 2: No."`
            ],
            [ 'ADD_REACTIONS' ],
            {
                name: 'poll',
                folder: 'Server',
                args: [4],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ]) && !this.isBotOwner(message.author.id)) {
            return message.reply(this.Embed.missing_perms(true));
        }

        let channel: TextChannel = message.mentions.channels.first();
        try {
            if(!channel) {
                channel = await message.client.channels.fetch(args[0]) as TextChannel;
            }
        } catch {
            return message.reply(this.Embed.fail('Invalid channel ID!'));
        }

        const perms = message.guild.me.permissionsIn(channel);
        const required = [ 'SEND_MESSAGES', 'ADD_REACTIONS', 'VIEW_CHANNEL', 'EMBED_LINKS' ] as PermissionString[];
        
        if(channel.type !== 'text') {
            return message.reply(this.Embed.fail('Channel must be a text channel!'));
        } else if(!perms.has(required)) {
            return message.reply(this.Embed.fail(`
            One of us doesn't have the needed permissions!
    
            Both of us must have \`\`${required.join(', ')}\`\` permissions in ${channel} to use this command!
            `));
        }

        const msg = args.join(' ').match(/(?<=").*?(?=")/gs); // match text inside of quotes and not the quotes
        if(!msg || msg.length !== 1) {
            return message.reply(this.Embed.fail('Invalid poll message!'));
        }

        const toBeParsed = args.slice(1).join(' ').match(/^(.*?)"/)?.[1].trim();
        if(!toBeParsed) {
            return message.reply(this.Embed.fail('Invalid emojis given!'));
        }

        const emojis = twemoji.parse(toBeParsed).map(({ text }) => text);
        if(emojis.length < 2) {
            return message.reply(this.Embed.fail('A poll must have at least 2 options to choose from!'));
        } else if(emojis.length > 5) {
            return message.reply(this.Embed.fail('A poll can have a max of 5 options!'));
        }

        const embed = this.Embed.success(msg.shift());
        const sent = await channel.send(embed);

        for(const emoji of emojis) {
            await sent.react(emoji);
        }
    }
}