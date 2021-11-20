import {
    ApplicationCommand,
    ApplicationCommandPermissionData,
    GuildResolvable,
    Permissions,
    Role
} from 'discord.js';
import { Message } from '../../lib/types/Discord.js.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Arguments, Command } from '../../Structures/Command.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { client } from '../../Structures/Database/Redis.js';

const defaultPermissionInteractions: ApplicationCommand<{ guild: GuildResolvable }>[] = []

export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'Guild Settings: sets the lowest moderator role allowed to perform mod actions (ban, kick, etc.).',
                '@moderator', '12345678912345678', 'moderator'
            ],
			{
                name: 'modrole',
                folder: 'Settings',
                args: [1, 1],
                aliases: ['mod'],
                ratelimit: 10,
                guildOnly: true
            }
        );
    }

    async init(message: Message, { content }: Arguments) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } else if (!hasPerms(message.channel, message.guild.me, Permissions.FLAGS.MANAGE_ROLES)) {
            return this.Embed.missing_perms(undefined, Permissions.FLAGS.MANAGE_ROLES);
        }

        const role = 
            await getMentions(message, 'roles') ?? 
            message.guild.roles.cache.find(r => r.name.toLowerCase() === content.toLowerCase());

        if (!(role instanceof Role)) {
            return this.Embed.fail(`${role ?? 'This'} is not a valid role!`);
        }

        if (defaultPermissionInteractions.length === 0) {
            if (!message.client.application?.owner) {
                await message.client.application?.fetch();
            }

            const commands = await message.client.application?.commands.fetch();
            const defaultPermissionFalse = [...commands?.filter(c => c.defaultPermission === false).values() ?? []];
            defaultPermissionInteractions.push(...defaultPermissionFalse);
        }

        const permissions: ApplicationCommandPermissionData[] = [{
            id: role.id,
            type: 'ROLE',
            permission: true
        }];

        for (const interaction of defaultPermissionInteractions) {
            await dontThrow(interaction.permissions.set({ guild: message.guild.id, permissions }));
        }

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild
            SET modRole = $1::text
            WHERE guild_id = $2::text
            RETURNING *;
        `, [role.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({ ...rows[0] }), 'EX', 600);

        return this.Embed.success(`The moderator role is now set as ${role}.`);
    }
}