import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { KhafraClient } from '../../../Bot/KhafraBot.js';
import { GuildSettings } from '../../../lib/types/Collections.js';

const toUpper = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1).toLowerCase()}`;

export default class extends Command {
    constructor() {
        super(
            [
                'Disable a command in a guild. Administrators bypass this inhibitor.',
                'badmeme'
            ],
			{
                name: 'disable',
                folder: 'Settings',
                args: [1, 1],
                guildOnly: true,
                aliases: [ 'blacklist', 'deny' ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        }

        const name = args.shift()!.toLowerCase();

        if(!KhafraClient.Commands.has(name)) {
            return message.reply(this.Embed.fail(`No command found with that name!`));
        } 

        const command = KhafraClient.Commands.get(name)!;
        
        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        if(settings?.disabledGuild?.includes(name)) {
            await collection.updateOne(
                { id: message.guild.id },
                { $pull: {
                    disabledGuild: {
                        $in: [ ...(command.settings.aliases ?? []), command.settings.name ]
                    }
                } }
            );

            return message.reply(this.Embed.success(`
            ${toUpper(command.settings.name)} has been un-blacklisted in the guild.
            `));
        }

        await collection.updateOne(
            { id: message.guild.id },
            { $push: {
                disabledGuild: {
                    $each: [ ...(command.settings.aliases ?? []), command.settings.name ]
                }
            } }
        );

        return message.reply(this.Embed.success(`
        ${toUpper(command.settings.name)} has been blacklisted in the guild.
        `));
    }
}