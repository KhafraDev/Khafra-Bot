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
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: 'hangman',
                    description: 'Guess the word before running out of guesses!',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: 'list',
                            description: 'list of words that you can use.',
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: 'play',
                            description: 'Let\'s play a game of hangman!',
                            options: [
                                {
                                    type: ApplicationCommandOptionType.String,
                                    name: 'lists',
                                    description: 'The list of words to randomly choose from.',
                                    choices: listsByName.map(word => ({ name: word, value: word }))
                                }
                            ]
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'minesweeper',
                    description: 'Play a game of MineSweeper directly in Discord!'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'rockpaperscissors',
                    description: 'Play a game of Rock Paper Scissors against the bot!'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'blackjack',
                    description: 'Play a game of Blackjack against the bot!'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'wordle',
                    description: 'Play a game of Wordle!'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'tictactoe',
                    description: 'Play a game of Tic-Tac-Toe!'
                }
            ]
        };
        
        super(sc, {
            defer: true
        });
    }
}