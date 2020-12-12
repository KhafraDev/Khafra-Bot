import { Message, MessageAttachment } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { washYourLyrics } from '../../lib/Backend/WashYourLyrics.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Wash your lyrics.',
                'The Beatles - Please Mister Postman',
                'Green Day - Brain Stew'
            ],
			{
                name: 'wyl',
                folder: 'Fun',
                args: [1],
                aliases: [ 'washyourlyrics', 'wash' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const [artist, ...name] = args.join(' ').split(' - ');
        
        if(name.length === 0) {
            return message.reply(this.Embed.generic('No song name provided!'));
        }

        message.channel.startTyping();
        let stream: NodeJS.ReadableStream | null = null;
        try {
            stream = await washYourLyrics(name.join(' '), artist);
        } catch {
            message.channel.stopTyping();
            return message.reply(this.Embed.fail(`
            An error occurred server-side and the image was not generated.

            This occurs when the song cannot be found.
            `));
        }

        message.channel.stopTyping();
        const a = new MessageAttachment(stream, 'wyl.png');
        return message.reply(this.Embed.success('https://washyourlyrics.com/')
            .attachFiles([ a ])
            .setImage('attachment://wyl.png')
        );
    }
}