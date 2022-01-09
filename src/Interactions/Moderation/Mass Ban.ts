import { Interactions } from '#khaf/Interaction';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { inlineCode } from '@khaf/builders';
import { APIApplicationCommandOption, ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, GuildMemberManager, PermissionResolvable, Permissions } from 'discord.js';
import { setTimeout } from 'timers/promises';

const pleaseInvite = `invite the bot to the guild using the ${inlineCode('invite')} command!`;
const perms = [ Permissions.FLAGS.BAN_MEMBERS ];

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'massban',
            description: 'Ban someone!',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'days',
                    description: 'Days of messages to clear (default is 7).',
                    min_value: 0,
                    max_value: 7
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'reason',
                    description: 'The reason you are banning the members for.'
                },
                ...Array.from({ length: 18 }, (_, i): APIApplicationCommandOption => ({
                    type: ApplicationCommandOptionType.User,
                    name: `member${i + 1}`,
                    description: `Member to ban.`,
                }))
            ]
        };

        super(sc, {
            defer: true,
            permissions: [
                Permissions.FLAGS.BAN_MEMBERS
            ]
        });
    }

    async init (interaction: CommandInteraction) {
        if (!interaction.inGuild()) {
            return `❌ Invalid permissions, ${pleaseInvite}`;
        } else if (!hasPerms(interaction.channel, interaction.guild?.me, perms)) {
            return `❌ I don't have permission to ban members in this guild!`;
        }

        const [err, guild] = interaction.guild
            ? [null, interaction.guild]
            : await dontThrow(interaction.client.guilds.fetch(interaction.guildId));

        if (err !== null || !guild) {
            return `❌ I couldn't fetch this guild, ${pleaseInvite}`;
        }

        const days = interaction.options.getInteger('days') ?? 7;
        const reason =
            interaction.options.getString('reason') ??
            `Requested by ${interaction.user.tag} (${interaction.user.id})`;

        const users: Map<string, ReturnType<GuildMemberManager['ban']>> = new Map();

        for (let i = 1; i < 18; i++) {
            const userOption = interaction.options.getUser(`member${i}`);

            if (userOption) {
                const member = interaction.options.getMember(`member${i}`);

                if (member) {
                    const memberPerms: PermissionResolvable = member.permissions instanceof Permissions
                        ? member.permissions
                        : new Permissions(BigInt(member.permissions as string));

                    if (memberPerms.has([ Permissions.FLAGS.BAN_MEMBERS ])) {
                        return `❌ I cannot ban ${member}!`;
                    }
                }

                users.set(userOption.id, guild.members.ban(userOption, { reason, days }));
            }
        }

        await dontThrow(interaction.editReply({
            content: `✅ Starting to ban these members... if you provided multiple, it may take a minute!`
        }));

        let description = '';
        for (const [id, user] of users.entries()) {
            try {
                const r = await user;
                description += `• - Successfully banned ${r}\n`;
            } catch (e) {
                description += `⨯ - Failed to ban ${id}\n`;
            } finally {
                // The less users there are, the less delay
                // we need as there's less chance of a ratelimit.
                await setTimeout(users.size ** 2 * 10);
            }
        }

        return void dontThrow(interaction.followUp({
            content: description
        }));
    }
}