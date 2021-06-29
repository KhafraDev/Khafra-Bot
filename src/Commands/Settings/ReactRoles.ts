import { Command, Arguments } from '../../Structures/Command.js';
import { Message, MessageActionRow, MessageEmbed, Permissions, Role } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { upperCase } from '../../lib/Utility/String.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { isText } from '../../lib/types/Discord.js.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { client } from '../../Structures/Database/Redis.js';
import { Components } from '../../lib/Utility/Constants/Components.js';

const perms = [
    Permissions.FLAGS.SEND_MESSAGES, 
    Permissions.FLAGS.VIEW_CHANNEL
];

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'GuildSettings: Create a message that users can interact with for a role!',
                '@role This role grants you absolutely nothing!',
                '504431559252639773 This role grants you admin powers 😱',
                '<channel id> to set a new channel'
            ],
			{
                name: 'reactrole',
                folder: 'Settings',
                args: [1],
                ratelimit: 10,
                guildOnly: true
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: kGuild) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.fail(`This command is only available for server admins!`);
        } else if (settings.reactRoleChannel === null || args.length === 1) {
            if (args.length !== 1) {
                return this.Embed.fail(`
                ${upperCase(message.guild.name)} does not have a set channel for react roles!

                Use this command again and provide a channel ID or mention a channel to set it!
                `);
            }

            const channel = await getMentions(message, 'channels');
            if (!isText(channel)) {
                return this.Embed.fail(`Channel must be a news or text channel!`);
            }

            await pool.query(`
                UPDATE kbGuild
                SET reactRoleChannel = $1::text
                WHERE kbGuild.guild_id = $2::text;
            `, [channel.id, message.guild.id]);

            await client.set(message.guild.id, JSON.stringify({
                ...settings,
                reactRoleChannel: channel.id
            }));

            return this.Embed.success(`
            Set the react role channel to ${channel}!

            Use this command but specify the channel and the message to send along with it!
            \`\`@role This role grants you absolutely nothing!\`\`
            \`\`504431559252639773 This role grants you admin powers 😱\`\`
            `);
        }

        const channel = message.guild.channels.cache.get(settings.reactRoleChannel);
        if (!isText(channel)) {
            return this.Embed.fail(`Couldn't find ${channel}, was it deleted?`);
        } else if (!hasPerms(channel, message.guild.me, perms)) {
            return this.Embed.fail(`I don't have permissions to view and send messages in ${channel}!`);
        }

        const role = await getMentions(message, 'roles');
        const content = args.slice(1).join(' ');
        
        if (!(role instanceof Role)) {
            return this.Embed.fail(`${args[0]} isn't a role! Try again!`);
        } else if (role.deleted || role.managed) {
            return this.Embed.fail(`Can't use ${role} as a react role!`);
        } else if (role.comparePositionTo(message.guild.me.roles.highest) > 0) {
            return this.Embed.fail(`Role supercedes my highest role - I don't have permissions to manage this role!`);
        }

        const { url } = await channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(role.hexColor as `#${string}`)
                    .setDescription(content)
            ],
            components: [
                new MessageActionRow().addComponents(
                    Components.approve(`Get ${role.name}`, role.id)
                )
            ]
        });

        return this.Embed.success(`Ok! Click [the button here](${url}) to get the ${role} role!`);
    }
}