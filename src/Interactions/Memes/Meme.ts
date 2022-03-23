import { Interactions } from '#khaf/Interaction';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'memes',
            description: 'The base command for the PseudoBot meme creator!',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'disabled',
                    description: '"Some disabilities look like this"',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Attachment,
                            name: 'image',
                            description: 'The image to overlay.',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'ifunny',
                    description: 'Show how funny a meme is by placing an iFunny watermark under it.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Attachment,
                            name: 'image',
                            description: 'The image you want an iFunny watermark on.',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'watching_until_i_laugh',
                    description: '"Watching a video until I laugh"',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Attachment,
                            name: 'image',
                            description: 'Something unfunny being reacted to.',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'title',
                            description: 'The video\'s title.',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'triggered',
                    description: 'Make this person triggered!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: 'person',
                            description: 'The person who\'s triggered!',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'megamind',
                    description: 'No beaches?',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'text',
                            description: 'Meme text: "No beaches?"',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'america',
                    description: 'Americanize someone!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: 'person',
                            description: 'Person to American-ize!'
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'communism',
                    description: 'Make someone a communist!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: 'person',
                            description: 'Person to radicalize!'
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'deep-fry',
                    description: 'Deep-fry someone\'s avatar or image!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: 'person',
                            description: 'Person\'s avatar to deep fry.'
                        },
                        {
                            type: ApplicationCommandOptionType.Attachment,
                            name: 'image',
                            description: 'Image to deep fry.'
                        }
                    ]
                }
            ]
        };

        super(sc, {
            defer: true
        });
    }
}