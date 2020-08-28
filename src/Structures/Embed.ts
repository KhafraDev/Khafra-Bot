import { MessageEmbed, PermissionString } from "discord.js";
// import { embed as EmbedColors } from '../../config.json';
import { readFileSync } from 'fs';
import { join } from "path";

const EmbedColors: { fail: string, success: string } = JSON.parse(
    readFileSync(join(__dirname, '../../config.json')).toString()
).embed;

export default {
    /**
     * An embed for any type of error!
     */
    fail: function(reason?: string) {
        const embed = new MessageEmbed()
            .setColor(EmbedColors.fail);

        if(reason) {
            embed.setDescription(reason);
        }
        return embed;
    },

    /**
     * An embed for a command being successfully executed!
     */
    success: function(reason?: string) {
        const embed = new MessageEmbed()
            .setColor(EmbedColors.success);
        
        if(reason) {
            embed.setDescription(reason);
        }
        
        return embed;
    },

    /**
     * An embed for missing permissions!
     */
    missing_perms: function(admin?: boolean, perms?: PermissionString[]) {
        return new MessageEmbed().setColor(EmbedColors.fail).setDescription(`
        One of us doesn't have the needed permissions!

        Both of us must have \`\`${perms?.join(', ') ?? this.permissions.join(', ')}\`\` permissions to use this command!
        ${admin ? 'You must have \`\`ADMINISTRATOR\`\` perms to use this command!' : '' }
        `);
    },

    /**
     * An embed for missing argument(s)!
     * @this {Command}
     */
    missing_args: function(missing: number, reason?: string) {
        return new MessageEmbed().setColor(EmbedColors.fail).setDescription(`
        ${reason ?? `${missing} argument${missing === 1 ? ' is' : 's are'} required!`}
        
        ${this.help.slice(1).map((e: string) => `\`\`${this.settings.name} ${e}\`\``).join('\n')}
        `);
    }
}