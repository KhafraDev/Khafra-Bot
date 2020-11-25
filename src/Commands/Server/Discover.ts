import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { DiscordDiscoverResults } from "../../lib/Backend/Discord Discover/types/DiscordDiscover";
import { DiscordDiscover } from "../../lib/Backend/Discord Discover/DiscordDiscover.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Search for Discord guilds.',
                'Synergism', 'MineCraft'
            ],
			{
                name: 'discover',
                folder: 'Server',
                args: [1],
                aliases: [ 'search', 'discovery' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let results: DiscordDiscoverResults;
        try {
            results = await DiscordDiscover(args.join(' '));
        } catch(e) {
            this.logger.log(`${this.settings.name}: ${e}`);
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        if(results.hits.length === 0) {
            return message.reply(this.Embed.fail('No results found!'));
        }

        const guild = results.hits.shift();
        const embed = this.Embed.success(guild.description)
            .setAuthor(
                guild.name, 
                `https://cdn.discordapp.com/icons/${guild.objectID}/${guild.icon}.png?size=128`, 
                guild.vanity_url_code ? `https://discord.gg/${guild.vanity_url_code}` : null
            )
            .addFields(
                { name: '**(A) Presences:**', value: guild.approximate_presence_count, inline: true },
                { name: '**(A) Members:**',   value: guild.approximate_member_count,   inline: true },
                { name: '**Boosts:**',        value: guild.premium_subscription_count, inline: true },
                { name: '**Emojis:**',        value: guild.emoji_count,                inline: true },
                { name: '**ID:**',            value: guild.objectID,                   inline: true },
                { name: '**Vanity URL:**',    value: guild.vanity_url_code ?? 'None',  inline: true }
            );

        return message.reply(embed);
    }
}