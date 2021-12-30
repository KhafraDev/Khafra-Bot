import { Interactions } from '#khaf/Interaction';
import { assets } from '#khaf/utility/Constants/Path.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { readdirSync } from 'fs';
import { extname, join } from 'path';

const assetsPath = join(assets, 'Hangman');
const listsByName = readdirSync(assetsPath).map(f => f.replace(extname(f), ''));

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'games',
            description: 'Command that handles games!',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'hangman',
                    description: 'Guess the word before running out of guesses!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'list',
                            description: 'list of words that you can use.',
                            required: false
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'play',
                            description: 'choose a list of words to play with.',
                            choices: listsByName.map(word => ({ name: word, value: word }))
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