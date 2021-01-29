import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Enable a role to use bot commands (administrators bypass this inhibitor).',
                '@BadmemeAllowed'
            ],
			{
                name: 'enablerole',
                folder: 'Settings',
                args: [1, 1],
                guildOnly: true,
                aliases: [ 'whitelistrole', 'allowrole' ]
            }
        );
    }

    async init(message: Message, _args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        }

        const role = await getMentions(message, 'roles');
        if(!role) {
            return message.reply(this.Embed.fail('Invalid Role!'));
        } else if(role.deleted) { // might as well
            return message.reply(this.Embed.fail('Deleted Role!'));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const has = settings?.enabledGuild?.some(g => g.type === 'role' && g.id === role.id);
        if(has) {
            await collection.updateOne(
                { id: message.guild.id },
                { $pull: {
                    enabledGuild: {
                        type: 'role',
                        id: role.id
                    }
                } }
            );

            return message.reply(this.Embed.success(`
            Commands have been un-whitelisted for ${role}.
            `));
        }

        await collection.updateOne(
            { id: message.guild.id },
            { $push: {
                enabledGuild: {
                    type: 'role',
                    id: role.id
                }
            } }
        );

        return message.reply(this.Embed.success(`
        Commands have been whitelisted for ${role}.
        `));
    }
}