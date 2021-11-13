import { CommandInteraction, Permissions } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { inlineCode } from '@khaf/builders';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { Minimalist } from '../../lib/Utility/Minimalist.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { validSnowflake } from '../../lib/Utility/Mentions.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

const pleaseInvite = `invite the bot to the guild using the ${inlineCode('invite')} command!`;
const notReally = ` (Not really, the bot is in ${inlineCode('dev')} mode!)`;
const processArgs = new Minimalist(process.argv.slice(2).join(' '));
const perms = [ Permissions.FLAGS.BAN_MEMBERS ];

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'unban',
            description: 'Unban someone!',
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

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const id = interaction.options.getString('member', true);

        if (!hasPerms(interaction.channel, interaction.member, perms)) {
            return `❌ You do not have permission to unban this member, try to ${pleaseInvite}`;
        } else if (!hasPerms(interaction.channel, interaction.client.user, perms)) {
            return `❌ I do not have permission to unban this member, try to ${pleaseInvite}`;
        } else if (!validSnowflake(id)) {
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
            ? [null, id]
            : await dontThrow(guild.bans.remove(id, reason));

        if (unbanErr !== null) {
            return `❌ An unexpected error has occurred: ${inlineCode(unbanErr.message)}`;
        }

        return Embed.success()
            .setDescription(`${unbanned} has been unbanned from the guild!${processArgs.get('dev') ? notReally : ''}`)
            .setAuthor(interaction.user.username, interaction.user.displayAvatarURL());
    }
} 