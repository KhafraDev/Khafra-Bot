import { client } from '#khaf/Client';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { validSnowflake } from '#khaf/utility/Mentions.js';
import { hierarchy } from '#khaf/utility/Permissions.js';
import { Embed as MessageEmbed } from '@khaf/builders';
import { Guild, GuildMember, MessageComponentInteraction } from 'discord.js';

type InteractionReply 
    = import('discord.js').Message<boolean> 
    | import('discord-api-types/v9').APIMessage
    | void

/**
 * Handle react roles, runs on every button interaction - including pagination that is present in other commands.
 * 
 * Non-reactrole interactions are quickly filtered out.
 */
export const interactionReactRoleHandler = async (interaction: MessageComponentInteraction, isDev = false) => {
    if (!validSnowflake(interaction.customId)) return;
    if (interaction.message.author.id !== client.user?.id) return;
    if (!(interaction.member instanceof GuildMember)) return;
    
    let guild: Guild | null = null; // guild can be null here
    if (!(interaction.guild instanceof Guild) && typeof interaction.guildId === 'string') {
        await dontThrow(interaction.deferReply({ ephemeral: true }));
        [, guild] = await dontThrow(client.guilds.fetch(interaction.guildId));
    } else {
        guild = interaction.guild;
    }

    if (!guild?.roles.cache.has(interaction.customId)) return;

    const role = guild.roles.cache.get(interaction.customId);
    if (!role || role.managed) return;

    if (!guild.me || !hierarchy(guild.me, interaction.member, false)) {
        const opts = { content: `❌ I do not have permission to manage your roles!` };
        const pr = interaction.deferred
            ? interaction.editReply(opts)
            : interaction.reply({ ephemeral: true, ...opts});

        return void dontThrow<InteractionReply>(pr);
    }

    try {        
        const had = interaction.member.roles.cache.has(role.id);
        if (had)
            await interaction.member.roles.remove(role);
        else 
            await interaction.member.roles.add(role);

        const opts = { embeds: [] as MessageEmbed[] };
        if (had) {
            opts.embeds.push(Embed.ok(`Removed role ${role} from you!`));
        } else {
            opts.embeds.push(Embed.ok(`Granted you the ${role} role!`));
        }

        const pr = interaction.deferred
            ? interaction.editReply(opts)
            : interaction.reply({ ephemeral: true, ...opts});

        return void dontThrow<InteractionReply>(pr);
    } catch (e) {
        if (isDev) {
            console.log(e);
        }

        const opts = { 
            embeds: [ Embed.error(`An error prevented me from granting you the role!`) ]
        }

        const pr = interaction.deferred
            ? interaction.editReply(opts)
            : interaction.reply({ ephemeral: true, ...opts });
            
        return void dontThrow<InteractionReply>(pr);
    }
}