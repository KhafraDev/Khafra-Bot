import { KhafraClient } from '#khaf/Bot';
import { Command, type Arguments } from '#khaf/Command';
import { cooldown } from '#khaf/cooldown/GlobalCooldown.js';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { isDM } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { Stats } from '#khaf/utility/Stats.js';
import { inlineCode } from '@discordjs/builders';
import { DiscordAPIError, Message, Attachment, type ReplyMessageOptions } from 'discord.js';
import { join } from 'node:path';
import { argv } from 'node:process';

const config = createFileWatcher(
    {} as typeof import('../../../../config.json'),
    join(cwd, 'config.json')
);

const cooldownUsers = cooldown(10, 60000);
const processArgs = new Minimalist(argv.slice(2).join(' '));
const disabled = typeof processArgs.get('disabled') === 'string'
    ? (processArgs.get('disabled') as string)
        .split(',')
        .map(c => c.toLowerCase())
    : [];

const defaultSettings = {
    max_warning_points: 20,
    mod_log_channel: null,
    welcome_channel: null
};

export const DM = async (message: Message): Promise<void> => {
    if (!isDM(message.channel)) return;

    const [mention, name, ...args] = message.content.split(/\s+/g);

    if (mention !== `<@!${config.botId}>` && mention !== `<@${config.botId}>`) {
        return;
    } else if (!KhafraClient.Commands.has(name.toLowerCase())) {
        return;
    }

    // !say hello world -> hello world
    const content = message.content.slice(mention.length + name.length + 2);
    const cli = new Minimalist(content);
    const command = KhafraClient.Commands.get(name.toLowerCase())!;

    if (!cooldownUsers(message.author.id)) { // user is rate limited
        return void dontThrow(message.reply({
            embeds: [
                Embed.error('Users are limited to 10 commands a minute.')
            ]
        }));
    } else if (command.settings.ownerOnly && !Command.isBotOwner(message.author.id)) {
        return void dontThrow(message.reply({
            embeds: [
                Embed.error(`\`${command.settings.name}\` is only available to the bot owner!`)
            ]
        }));
    } else if (command.settings.guildOnly) {
        return void dontThrow(message.reply({
            embeds: [
                Embed.error('This command is only available in guilds!')
            ]
        }));
    } else if (disabled.includes(command.settings.name) || command.settings.aliases?.some(c => disabled.includes(c))) {
        return void dontThrow(message.reply({
            content: `${inlineCode(name)} is temporarily disabled!`
        }));
    }

    const options: Arguments = { args, commandName: name.toLowerCase(), content, cli };
    Stats.session++;

    try {
        const returnValue = await command.init(message, options, defaultSettings);
        if (!returnValue || returnValue instanceof Message)
            return;

        const param = {
            failIfNotExists: false
        } as ReplyMessageOptions;

        if (typeof returnValue === 'string') {
            param.content = returnValue;
        } else if (returnValue instanceof Attachment) {
            param.files = [returnValue];
        } else if (typeof returnValue === 'object') { // MessageOptions
            if (EmbedUtil.isAPIEmbed(returnValue)) {
                param.embeds = [returnValue];
            } else {
                Object.assign(param, returnValue);
            }
        }

        return void await message.reply(param);
    } catch (e) {
        if (processArgs.get('dev') === true) {
            console.log(e); // eslint-disable-line no-console
        }

        if (!(e instanceof Error)) {
            return;
        } else if (e instanceof DiscordAPIError) {
            // if there's an error sending a message, we should probably
            // not send another message. in the future try figuring out
            // the error code and basing this check off of that.
            return;
        }

        const error = 'An unexpected error has occurred!';

        return void dontThrow(message.reply({
            embeds: [Embed.error(error)],
            failIfNotExists: false
        }));
    }
}