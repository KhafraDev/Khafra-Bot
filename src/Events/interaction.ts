import { Event } from '../Structures/Event.js';
import { Guild, GuildMember, Interaction, InteractionReplyOptions, MessageEmbed } from 'discord.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { validSnowflake } from '../lib/Utility/Mentions.js';
import { client } from '../index.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';

@RegisterEvent
export class kEvent extends Event<'interactionCreate'> {
    name = 'interactionCreate' as const;

    async init(interaction: Interaction) {
        if (interaction.isMessageComponent()) { // "react" roles
            if (!validSnowflake(interaction.customId)) return;
            if (interaction.message.author.id !== client.user!.id) return;
            if (!(interaction.member instanceof GuildMember)) return;
            
            let guild: Guild | null = null; // guild can be null here
            if (!(interaction.guild instanceof Guild) && typeof interaction.guildId === 'string') {
                try {
                    await interaction.defer({ ephemeral: true });
                    guild = await client.guilds.fetch(interaction.guildId);
                } catch {}
            } else {
                guild = interaction.guild;
            }

            if (!guild?.roles.cache.has(interaction.customId)) return;

            const role = guild.roles.cache.get(interaction.customId);
            if (!role || role.deleted || role.managed) return;

            try {
                if (interaction.member.partial)
                    await interaction.member.fetch();
                
                const had = interaction.member.roles.cache.has(role.id);
                if (had)
                    await interaction.member.roles.remove(role);
                else 
                    await interaction.member.roles.add(role);

                const opts: InteractionReplyOptions = { embeds: [] };
                if (had) opts.embeds!.push(Embed.success(`Removed role ${role} from you!`));
                else opts.embeds!.push(Embed.success(`Granted you the ${role} role!`));

                return interaction.deferred
                    ? interaction.editReply(opts)
                    : interaction.reply({
                        ephemeral: true,
                        ...opts
                      });
            } catch {                
                const opts = { embeds: [Embed.fail(`An error prevented me from granting you the role!`)] };
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

        const command = KhafraClient.Interactions.get(interaction.commandName)!;

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