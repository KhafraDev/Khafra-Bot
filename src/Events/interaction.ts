import { Event } from '../Structures/Event.js';
import { Guild, GuildMember, Interaction, InteractionReplyOptions, MessageEmbed } from 'discord.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { validSnowflake } from '../lib/Utility/Mentions.js';
import { client } from '../index.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'interaction' as const;

    async init(interaction: Interaction) {
        if (interaction.isMessageComponent()) { // "react" roles
            if (!validSnowflake(interaction.customID)) return;
            if (interaction.message.author.id !== client.user.id) return;
            if (!(interaction.member instanceof GuildMember)) return;
            
            let guild: Guild | null = null; // guild can be null here
            if (!(interaction.guild instanceof Guild)) {
                try {
                    await interaction.defer({ ephemeral: true });
                    guild = await client.guilds.fetch(interaction.guildID);
                } catch {}
            } else {
                guild = interaction.guild;
            }

            if (!guild?.roles.cache.has(interaction.customID)) return;

            const role = guild.roles.cache.get(interaction.customID);
            if (role.deleted || role.managed) return;

            try {
                await interaction.member.roles.add(role);

                const opts = {
                    embeds: [Embed.success(`Granted you the ${role} role!`)]
                };
                return interaction.deferred
                    ? interaction.editReply(opts)
                    : interaction.reply({
                        ephemeral: true,
                        ...opts
                      });
            } catch (e) {
                console.log(e);
                
                const opts = {
                    embeds: [Embed.fail(`An error prevented me from granting you the role!`)]
                }
                return interaction.deferred
                    ? interaction.editReply(opts)
                    : interaction.reply({
                        ephemeral: true,
                        ...opts
                      });
            }
        }
        
        if (!interaction.isCommand()) return;
        if (!KhafraClient.Interactions.has(interaction.commandName)) return;

        const command = KhafraClient.Interactions.get(interaction.commandName);

        try {
            if (command.options?.defer)
                await interaction.defer();

            const result = await command.init(interaction);

            if (typeof result !== 'string' && !(result instanceof MessageEmbed))
                return interaction.deleteReply();

            const param = {} as InteractionReplyOptions;
            if (typeof result === 'string')
                param.content = result;
            else if (result instanceof MessageEmbed)
                param.embeds = [result];

            if (interaction.deferred)
                return interaction.editReply(param);

            return interaction.reply(param);
        } catch (e) {
            // TODO(@KhafraDev): do something with error?
        }
    }
} 