import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, SnowflakeUtil } from 'discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'ping',
            description: 'Get the bot\'s ping!',
        };

        super(sc);
    }

    async init (interaction: CommandInteraction) {
        const m = await interaction.reply({
            embeds: [Embed.ok('Pinging...!')],
            fetchReply: true
        });

        const interactionCreated = SnowflakeUtil.timestampFrom(interaction.id);
        const replyCreated = SnowflakeUtil.timestampFrom(m.id);
        
        const embed = Embed.ok(`
        Pong! 🏓

        Bot: ${replyCreated - interactionCreated} ms
        Heartbeat: ${interaction.client.ws.ping} ms
        `);

        return void dontThrow(interaction.followUp({ embeds: [embed] }));
    }
} 