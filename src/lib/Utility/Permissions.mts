import { inlineCode } from '@discordjs/builders'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { type GuildMember, type PermissionResolvable, PermissionsBitField } from 'discord.js'

/**
 * Compares 2 guildmembers and checks if @see {a} is higher in the hierarchy than @see {b}
 * @see https://discord.js.org/#/docs/main/stable/class/Role?scrollTo=comparePositionTo
 * @see https://discord.js.org/#/docs/main/stable/class/GuildMember?scrollTo=manageable
 */
export const hierarchy = (a: GuildMember | null, b: GuildMember | null, strict = true): boolean => {
  if (!a || !b) return false
  if (a.guild.ownerId === a.id) return true

  return strict
    ? a.roles.highest.comparePositionTo(b.roles.highest) > 0
    : a.roles.highest.comparePositionTo(b.roles.highest) >= 0
}

const all = Object.entries(PermissionFlagsBits) as [keyof typeof PermissionFlagsBits, bigint][]

export const permResolvableToReadable = (perms: PermissionResolvable): `\`${keyof typeof PermissionFlagsBits}\``[] => {
  const bitfield = PermissionsBitField.resolve(perms)

  if ((PermissionFlagsBits.Administrator & bitfield) === PermissionFlagsBits.Administrator) {
    return [inlineCode('Administrator')]
  }

  const has: `\`${keyof typeof PermissionFlagsBits}\``[] = []

  for (const [name, bit] of all) {
    if ((bit & bitfield) === bit) {
      has.push(inlineCode(name))
    }
  }

  return has
}

export const bitfieldToString = (perms: bigint[]): string | undefined => {
  const bitfield = perms.reduce((a, b) => a | b, 0n)

  return bitfield === 0n ? undefined : bitfield.toString()
}
