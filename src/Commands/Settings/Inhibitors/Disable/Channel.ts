import { Command } from "../../../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../../../Structures/Database/Mongo.js";
import { KhafraClient } from "../../../../Bot/KhafraBot.js";
import { getMentions, validSnowflake } from "../../../../lib/Utility/Mentions.js";
import { GuildSettings } from "../../../../lib/types/Collections.js";

const c = [ 'Settings', 'Server' ];

export default class extends Command {
    constructor() {
        super(
            [
                'Disable a command (or all) in a channel.',
                '#general',
                '#general badmeme',
                '503024525076725775',
                '503024525076725775'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'disablechannel',
                folder: 'Settings',
                args: [1, 2],
                guildOnly: true,
                aliases: [ 'blacklistchannel', 'denychannel' ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms(true));
        } 

        let idOrChannel = getMentions(message, args, { type: 'channels' });
        if(!idOrChannel || (typeof idOrChannel === 'string' && !validSnowflake(idOrChannel))) {
            idOrChannel = message.channel; 
        } else if(typeof idOrChannel === 'string' && message.guild.channels.cache.has(idOrChannel)) {
            idOrChannel = message.guild.channels.cache.get(idOrChannel);
        }

        if(!idOrChannel) {
            return message.channel.send(this.Embed.fail('Invalid Channel!'));
        } else if(!['text', 'news'].includes(idOrChannel.type)) {
            return message.channel.send(this.Embed.fail('Invalid Channel!'));
        }

        let command: string[];
        if(args.length === 1) {
            command = ['*'];
        } else {
            if(!KhafraClient.Commands.has(args[1].toLowerCase())) {
                return message.channel.send(this.Embed.fail('No command with that name found!'));
            }

            const cmd = KhafraClient.Commands.get(args[1].toLowerCase());
            if(c.includes(cmd.settings.folder)) {
                return message.channel.send(this.Embed.fail('Can\'t disable commands in this category!'));
            }
            command = [].concat(cmd.settings.name, ...(cmd.settings.aliases ?? []));
        }

        if(settings?.disabledChannel?.some(c => 
            c.names.includes(command[0]) && c.id === idOrChannel.id
        )) {
            return message.channel.send(this.Embed.fail(`Command is already disabled in this channel!`));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { 
                $push: {
                    disabledChannel: {
                        main: command[0],
                        names: command,
                        id: idOrChannel.id
                    }
                }
            },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.channel.send(this.Embed.success(`
            Command ${command[0]} has been disabled in ${idOrChannel}!
            `));
        } else {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}