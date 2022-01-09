import { ChatInputCommandInteraction, Permissions } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { inlineCode } from '@khaf/builders';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { validSnowflake } from '#khaf/utility/Mentions.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { argv } from 'process';

const pleaseInvite = `invite the bot to the guild using the ${inlineCode('invite')} command!`;
const notReally = ` (Not really, the bot is in ${inlineCode('dev')} mode!)`;
const processArgs = new Minimalist(argv.slice(2).join(' '));
const perms = [ Permissions.FLAGS.BAN_MEMBERS ];

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'unban',
            description: 'Unban someone!',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'member',
                    description: 'Member to unban.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'reason',
                    description: 'The reason you are unbanning the member for.'
                }
            ]
        };

        super(sc, {
            defer: true,
            permissions: [
                Permissions.FLAGS.BAN_MEMBERS
            ]
        });
    }

    async init(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser('member', true);

        if (!hasPerms(interaction.channel, interaction.member, perms)) {
            return `❌ You do not have permission to unban this member, try to ${pleaseInvite}`;
        } else if (!hasPerms(interaction.channel, interaction.guild?.me, perms)) {
            return `❌ I do not have permission to unban this member, try to ${pleaseInvite}`;
        } else if (!validSnowflake(user.id)) {
            return '❌ That isn\'t a user ID, try again!';
        }

        const reason =
            interaction.options.getString('reason') ??
            `Unban requested by ${interaction.user.tag} (${interaction.user.id}).`;

        if (!interaction.guild && !interaction.guildId) {
            return `❌ Invalid permissions, ${pleaseInvite}`;
        }

        const [err, guild] = interaction.guild
            ? [null, interaction.guild]
            : await dontThrow(interaction.client.guilds.fetch(interaction.guildId!));

        if (err !== null) {
            return `❌ I couldn't fetch this guild, ${pleaseInvite}`;
        }
        
        const [unbanErr, unbanned] = processArgs.get('dev')
            ? [null, user]
            : await dontThrow(guild.bans.remove(user, reason));

        if (unbanErr !== null) {
            return `❌ An unexpected error has occurred: ${inlineCode(unbanErr.message)}`;
        }

        return Embed.ok()
            .setDescription(`${unbanned} has been unbanned from the guild!${processArgs.get('dev') ? notReally : ''}`)
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            });
    }
} 