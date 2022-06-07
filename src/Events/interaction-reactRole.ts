import { client } from '#khaf/Client';
import { Event } from '#khaf/Event';
import { logger } from '#khaf/Logger';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { validSnowflake } from '#khaf/utility/Mentions.js';
import { hierarchy } from '#khaf/utility/Permissions.js';
import type { APIEmbed } from 'discord-api-types/v10';
import { Events, type Interaction } from 'discord.js';

export class kEvent extends Event<typeof Events.InteractionCreate> {
    name = Events.InteractionCreate;

    async init (interaction: Interaction): Promise<void> {
        if (!interaction.isMessageComponent()) {
            return;
        } else if (!interaction.inCachedGuild()) {
            // https://github.com/discordjs/discord.js/blob/8f6df90035e964d8779a6aab716c2f7f138975d5/src/structures/Interaction.js#L168
            // interaction.member and interaction.guild exist
            return;
        } else if (
            !validSnowflake(interaction.customId) ||
            interaction.member.id !== client.user?.id
        ) {
            return;
        }

        const guild = interaction.guild;
        const role = guild.roles.cache.get(interaction.customId);

        if (!role) {
            return void await interaction.reply({
                content: '❌ This role isn\'t cached or has been deleted.',
                ephemeral: true
            });
        } else if (!guild.members.me || !hierarchy(guild.members.me, interaction.member, false)) {
            return void await interaction.reply({
                content: '❌ I do not have permission to manage your roles!',
                ephemeral: true
            });
        }

        try {
            const had = interaction.member.roles.cache.has(role.id);
            const opts = { ephemeral: true, embeds: [] as APIEmbed[] } as const;

            if (had) {
                await interaction.member.roles.remove(role);
                opts.embeds.push(Embed.ok(`Removed role ${role} from you!`));
            } else {
                await interaction.member.roles.add(role);
                opts.embeds.push(Embed.ok(`Granted you the ${role} role!`));
            }

            return void await interaction.reply(opts);
        } catch (e) {
            logger.log('react role', e);

            return void await interaction.reply({
                embeds: [
                    Embed.error('An error prevented me from granting you the role!')
                ],
                ephemeral: true
            });
        }
    }
}