import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { request } from 'undici';

interface StrawpollBody {
    poll: Partial<{
        title: string
        answers: string[]
        priv: boolean
        co: boolean
        ma: boolean
        mip: boolean
        enter_name: boolean
        deadline: Date | undefined
        only_reg: boolean
        vpn: boolean
        captcha: boolean
    }>
}

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'strawpoll',
            description: 'Create a poll on strawpoll.com!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'title',
                    description: 'The poll\'s title.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-1',
                    description: 'The first choice to add to the poll.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-2',
                    description: 'The second choice to add to the poll.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'private',
                    description: 'If the poll should be private, defaults to true.'
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'allow-comments',
                    description: 'If users should be allowed to leave comments, defaults to true.'
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'multiple-answers',
                    description: 'If users can leave multiple answers, defaults to false.'
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'multiple-votes-per-ip',
                    description: 'If users can vote multiple times, default to false.'
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'name',
                    description: 'If users are required to leave their name, defaults to false.'
                },
                // TODO: add date option once the api is updated
                /*{
                    type: ApplicationCommandOptionType.String,
                    name: 'date',
                    description: 'If the poll should be private, defaults to true.'
                },*/
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'only-registered',
                    description: 'If the poll should only allow registered users to vote, defaults to false.'
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'vpn',
                    description: 'If the poll should allow VPN users to vote, defaults to false.'
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'captcha',
                    description: 'If the poll requires a captcha to vote, defaults to true.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-3',
                    description: 'The third choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-4',
                    description: 'The fourth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-5',
                    description: 'The fifth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-6',
                    description: 'The sixth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-7',
                    description: 'The seventh choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-8',
                    description: 'The eighth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-9',
                    description: 'The ninth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-10',
                    description: 'The tenth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-11',
                    description: 'The eleventh choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-12',
                    description: 'The twelfth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-13',
                    description: 'The thirteenth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-14',
                    description: 'The fourteenth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-15',
                    description: 'The fifteenth choice to add to the poll.'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'choice-16',
                    description: 'The sixteenth choice to add to the poll.'
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const answers: string[] = [];

        for (let i = 1; i <= 16; i++) {
            const option = interaction.options.getString(`choice-${i}`, i <= 2);

            if (option) {
                answers.push(option);
            }
        }

        const poll: StrawpollBody['poll'] = {
            title: interaction.options.getString('title', true),
            answers: answers,
            priv: interaction.options.getBoolean('private') ?? true,
            co: interaction.options.getBoolean('allow-comments') ?? false,
            ma: interaction.options.getBoolean('multiple-answers') ?? false,
            mip: interaction.options.getBoolean('multiple-votes-per-ip') ?? false,
            enter_name: interaction.options.getBoolean('name') ?? false,
            only_reg: interaction.options.getBoolean('only-registered') ?? false,
            vpn: interaction.options.getBoolean('vpn') ?? false,
            captcha: interaction.options.getBoolean('captcha') ?? true
        };

        const { body } = await request('https://strawpoll.com/api/poll', {
            method: 'POST',
            body: JSON.stringify({ poll } as StrawpollBody)
        });

        const j = await body.json() as { admin_key: string, content_id: string, success: 1 | 0 };

        return {
            embeds: [
                Embed.ok(`
                Your Strawpoll can be found at:
                https://strawpoll.com/${j.content_id}
                `)
            ]
        }
    }
}