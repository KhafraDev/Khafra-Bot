import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { KhafraClient } from '../../../Bot/KhafraBot.js';
import { upperCase } from '../../../lib/Utility/String.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'GuildSettings: Enable a command in the entire guild. Commands that aren\'t whitelisted won\'t be usable after this.',
                'badmeme'
            ],
			{
                name: 'enable',
                folder: 'Settings',
                args: [1, 1],
                aliases: [ 'whitelist' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: GuildSettings) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);
        
        const command = KhafraClient.Commands.get(args[0].toLowerCase());
        if (!command)
            return this.Embed.generic(this, 'That isn\'t a command!');
        if (['Settings', 'Moderation'].includes(command.settings.folder))
            return this.Embed.fail(`You can't whitelist commands in the ${command.settings.folder} folder!`);
        
        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const pull = settings?.whitelist?.includes(command.settings.name);

        const updated = await collection.updateOne(
            { id: message.guild.id },
            { [pull ? '$pull' : '$push']: {
                whitelist: {
                    [pull ? '$in' : '$each']: [ ...(command.settings.aliases ?? []), command.settings.name ]
                }
            } },
            { upsert: true }
        );

        if (updated.modifiedCount === 1) {
            if (pull)
                return this.Embed.success(`${upperCase(command.settings.name)} is no longer whitelisted!`);
            return this.Embed.success(`${upperCase(command.settings.name)} has been whitelisted in this guild!`);
        } else {
            return this.Embed.fail(`An unexpected error occurred!`);
        }
    }
}