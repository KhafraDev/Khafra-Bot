import { inlineCode } from '@khaf/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction } from 'discord.js';
import { parse } from 'twemoji-parser';
import { fetch } from 'undici';
import { URL } from 'url';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Interactions } from '#khaf/Interaction';

const enum Subcommands {
    HELP = 'help',
    MIX = 'mix'
}

const enum SubcommandOptions {
    LIST = 'list',
    FIRST = 'first',
    SECOND = 'second'
}

interface EmojiKitchen {
    locale: string
    results: {
        id: string
        title: string
        media_formats: {
            [key: string]: {
                url: string
                duration: number
                preview: string
                dims: number[]
                size: number
            }
        },
        created: number
        content_description: string
        h1_title: string
        itemurl: string,
        url: string
        tags: string[]
        flags: string[]
        hasaudio: boolean
    }[],
    next: string
}

const supportedListURL = `https://raw.githubusercontent.com/UCYT5040/Google-Sticker-Mashup-Research/375c7f176cedb7ae7170d65a97f382899d13abfd/emojis.txt`;
const list: string[] = [];
const cache = new Map<string, string>();

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'emojimix',
            description: `Mix two emojis together!`,
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: Subcommands.MIX,
                    description: 'Mix two emojis!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: SubcommandOptions.FIRST,
                            description: 'First emoji to mix.',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: SubcommandOptions.SECOND,
                            description: 'Second emoji to mix.',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: Subcommands.HELP,
                    description: 'Get help with this slash command!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'list',
                            description: 'Option to get help with.',
                            required: true,
                            choices: [
                                { name: 'list emojis', value: 'list emojis' }
                            ]
                        }
                    ]
                }
            ]
        };
        
        super(sc);
    }

    async init(interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand(true);

        if (subcommand === 'mix') {
            const emojiOne = interaction.options.getString(SubcommandOptions.FIRST, true);
            const emojiTwo = interaction.options.getString(SubcommandOptions.SECOND, true);
    
            const query = `${emojiOne}_${emojiTwo}`;
            const oneParsed = parse(emojiOne);
            const twoParsed = parse(emojiTwo);
    
            if (oneParsed.map(p => p.text).join('') !== emojiOne) {
                return `❌ First emoji could not be parsed correctly!`;
            } else if (twoParsed.map(p => p.text).join('') !== emojiTwo) {
                return `❌ Second emoji could not be parsed correctly!`;
            }
            
            if (cache.has(query)) {
                return Embed.ok()
                    .setTitle(`${emojiOne} + ${emojiTwo} =`)
                    .setImage(cache.get(query)!);
            }
    
            // https://github.com/UCYT5040/Google-Sticker-Mashup-Research
            const api = new URL('https://tenor.googleapis.com/v2/featured');
            api.searchParams.append('key', 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ');
            api.searchParams.append('client_key', 'gboard');
            api.searchParams.append('contentfilter', 'high');
            api.searchParams.append('media_filter', 'png_transparent');
            api.searchParams.append('component', 'proactive');
            api.searchParams.append('collection', 'emoji_kitchen_v5');
            api.searchParams.append('locale', 'en_US');
            api.searchParams.append('country', 'US');
            api.searchParams.append('q', query);
    
            await interaction.deferReply();
            const [err, res] = await dontThrow(fetch(api));
    
            if (err !== null) {
                return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
            }
    
            const j = await res!.json() as EmojiKitchen;
    
            if (j.results.length === 0) {
                return `❌ One or more emojis you provided are not supported, or might not work as a combo.`;
            }
    
            const url = j.results[0].url;
            cache.set(query, url);
    
            return Embed.ok()
                .setTitle(`${emojiOne} + ${emojiTwo} =`)
                .setImage(url);
        } else {
            const listOpt = interaction.options.getString(SubcommandOptions.LIST);

            if (listOpt) {
                if (list.length === 0) {
                    await interaction.deferReply();
                    const [err, res] = await dontThrow(fetch(supportedListURL));
                    
                    if (err !== null) {
                        return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
                    }

                    const listJoined = await res!.text();
                    const split = listJoined.trim().split(/\r?\n/g);

                    list.push(...split);
                }

                return Embed.ok(list.join(' '))
                    .setTitle(`Supported Emojis`)
                    .setURL(supportedListURL);
            }
        }
    }
} 