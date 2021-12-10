import { Arguments, Command } from '../../Structures/Command.js';
import { AllowedImageFormat, AllowedImageSize, ImageURLOptions, Message } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';

const avatarSizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const avatarFormats = ['webp', 'png', 'jpg', 'jpeg', 'gif'];

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get someone\'s avatar!',
                '', 
                '@Khafra#0001', 
                '267774648622645249',
                '@Khafra#0001 --size 256 --format jpg',
                '@Khafra#0001 -s 256 -f gif'
            ],
			{
                name: 'avatar',
                folder: 'Server',
                args: [0, 5],
                aliases: ['av', 'a'],
                ratelimit: 3
            }
        );
    }

    async init(message: Message, { cli }: Arguments) {
        const user = await getMentions(message, 'users') ?? message.author;
        
        const opts: ImageURLOptions = {
            size: 512,
            format: 'png',
            dynamic: true
        };

        if (cli.has('size') || cli.has('s')) {
            const value = Number(cli.get('size') || cli.get('s'));
            if (avatarSizes.includes(value)) {
                opts.size = value as AllowedImageSize;
            }
        }

        if (cli.has('format') || cli.has('f')) {
            const value = cli.get('format') || cli.get('f');
            if (typeof value === 'string' && avatarFormats.includes(value)) {
                opts.format = value as AllowedImageFormat & 'gif';
            }
        }

        const avatar = user.displayAvatarURL(opts);
        
        return this.Embed.ok(`${user}'s avatar`).setImage(avatar);
    }
}