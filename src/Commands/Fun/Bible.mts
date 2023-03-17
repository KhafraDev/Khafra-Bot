import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { upperCase } from '#khaf/utility/String.mjs'
import { inlineCode } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { env } from 'node:process'
import { URL } from 'node:url'
import { request } from 'undici'

interface IBibleVerse {
  book: string
  chapter: number
  verse: number
  content: string
}

const titles = {
  'Genesis': 'gen',
  'Exodus': 'exo',
  'Leviticus': 'lev',
  'Numbers': 'num',
  'Deuteronomy': 'deu',
  'Joshua': 'jos',
  'Judges': 'jdg',
  'Ruth': 'rut',
  '1 Samuel': 'sa1',
  '2 Samuel': 'sa2',
  '1 Kings': 'kg1',
  '2 Kings': 'kg2',
  '1 Chronicles': 'ch1',
  '2 Chronicles': 'ch2',
  'Ezra': 'ezr',
  'Nehemiah': 'neh',
  'Esther': 'est',
  'Job': 'job',
  'Psalms': 'psa',
  'Proverbs': 'pro',
  'Ecclesiastes': 'ecc',
  'Song of Solomon': 'sol',
  'Isaiah': 'isa',
  'Jeremiah': 'jer',
  'Lamentations': 'lam',
  'Ezekiel': 'eze',
  'Daniel': 'dan',
  'Hosea': 'hos',
  'Joel': 'joe',
  'Amos': 'amo',
  'Obadiah': 'oba',
  'Jonah': 'jon',
  'Micah': 'mic',
  'Nahum': 'nah',
  'Habakkuk': 'hab',
  'Zephaniah': 'zep',
  'Haggai': 'hag',
  'Zechariah': 'zac',
  'Malachi': 'mal',
  '1 Esdras': 'es1',
  '2 Esdras': 'es2',
  'Tobias': 'tob',
  'Judith': 'jdt',
  'Additions to Esther': 'aes',
  'Wisdom': 'wis',
  'Baruch': 'bar',
  'Epistle of Jeremiah': 'epj',
  'Susanna': 'sus',
  'Bel and the Dragon': 'bel',
  'Prayer of Manasseh': 'man',
  '1 Macabees': 'ma1',
  '2 Macabees': 'ma2',
  '3 Macabees': 'ma3',
  '4 Macabees': 'ma4',
  'Sirach': 'sir',
  'Prayer of Azariah': 'aza',
  'Laodiceans': 'lao',
  'Joshua B': 'jsb',
  'Joshua A': 'jsa',
  'Judges B': 'jdb',
  'Judges A': 'jda',
  'Tobit BA': 'toa',
  'Tobit S': 'tos',
  'Psalms of Solomon': 'pss',
  'Bel and the Dragon Th': 'bet',
  'Daniel Th': 'dat',
  'Susanna Th': 'sut',
  'Odes': 'ode',
  'Matthew': 'mat',
  'Mark': 'mar',
  'Luke': 'luk',
  'John': 'joh',
  'Acts': 'act',
  'Romans': 'rom',
  '1 Corinthians': 'co1',
  '2 Corinthians': 'co2',
  'Galatians': 'gal',
  'Ephesians': 'eph',
  'Philippians': 'phi',
  'Colossians': 'col',
  '1 Thessalonians': 'th1',
  '2 Thessalonians': 'th2',
  '1 Timothy': 'ti1',
  '2 Timothy': 'ti2',
  'Titus': 'tit',
  'Philemon': 'plm',
  'Hebrews': 'heb',
  'James': 'jam',
  '1 Peter': 'pe1',
  '2 Peter': 'pe2',
  '1 John': 'jo1',
  '2 John': 'jo2',
  '3 John': 'jo3',
  'Jude': 'jde',
  'Revelation': 'rev'
}

const titleRegex = new RegExp(Object.keys(titles).join('|'), 'i')

const R = {
  GENERIC: /(\d{1,2}):(\d{1,2})/,
  BETWEEN: /(\d{1,2}):(\d{1,2})-(\d{1,2})/
} as const

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get a King James Bible verse.',
        'Nahum 3:7', 'Proverbs 25:19'
      ],
      {
        name: 'bible',
        folder: 'Fun',
        args: [0]
      }
    )
  }

  async init (_message: Message, { args, content }: Arguments): Promise<undefined | APIEmbed> {
    // no arguments provided, get a random entry
    if (args.length === 0) {
      const url = new URL('/bible/random', env.WORKER_BIBLE_BASE)
      const { body } = await request(url)
      const row = await body.json() as IBibleVerse

      // basically the same as bookAcronym down below
      const book = Object
        .entries(titles)
        .find(([, c]) => c.toLowerCase() === row.book.toLowerCase())!
        .shift()!

      const embed = Embed.json({
        color: colors.ok,
        title: `${book} ${row.chapter}:${row.verse}`,
        description: row.content
      })

      return embed
    }

    // list all books available to the bot
    if (args[0].toLowerCase() === 'list') {
      return Embed.ok(Object.keys(titles).map(t => inlineCode(t)).join(', '))
    } else if (!titleRegex.test(content)) {
      return Embed.error(`
      No book with that name was found!

      Use ${inlineCode(`${this.settings.name} list`)} to list all of the supported book names!
      `)
    }

    const book = titleRegex.exec(content)![0].toLowerCase().trim()
    // get the acronym of the book, for example "Prayer of Azariah" -> "aza"
    const bookAcronym = Object
      .entries(titles)
      .find(([n, acr]) => n.toLowerCase() === book || acr === book)!

    // get the chapter+verse
    const locationUnformatted = content.split(book).at(-1)!.trim()

    // Example: 13:1-5
    // Get verses 1 to 5 from Exodus chapter 13
    if (R.BETWEEN.test(locationUnformatted)) {
      const [, chapter, ...verses] = R.BETWEEN
        .exec(locationUnformatted)! // not null since it matches the pattern
        .map(Number) // Not NaN because the regex checks for numbers

      // prevent >10 verses from being sent at a time
      // not only to prevent abuse, but because of the character limit
      const versesDiff = verses[1] - verses[0] > 10
        ? [verses[0], verses[0] + 9] // sql between is inclusive
        : verses

      const book = upperCase(bookAcronym.pop()!)
      const url = new URL(
        `/bible/between?book=${book}&chapter=${chapter}&verse1=${versesDiff[0]}&verse2=${versesDiff[1]}`,
        env.WORKER_BIBLE_BASE
      )
      const { body } = await request(url)
      const rows = await body.json() as IBibleVerse[]

      if (rows.length === 0) {
        return Embed.error(`No verses found in ${bookAcronym[1]} ${chapter}:${versesDiff[0]}-${versesDiff[1]}! 😕`)
      }

      const [first, last] = rows.slice(0, 2)
      const embed = Embed.json({
        color: colors.ok,
        title: `${bookAcronym.pop()} ${chapter}:${first.verse}-${last.verse}`,
        description: `${rows.map(v => v.content).join('\n')}`.slice(0, maxDescriptionLength)
      })

      return embed
    }

    // only one verse; doesn't fit criteria for other cases
    if (R.GENERIC.test(locationUnformatted)) {
      const [, chapter, verse] = R.GENERIC
        .exec(locationUnformatted)!
        .map(Number)

      const url = new URL(
        `/bible/verse?book=${upperCase(bookAcronym[1])}&chapter=${chapter}&verse=${verse}`,
        env.WORKER_BIBLE_BASE
      )
      const { body } = await request(url)
      const row = await body.json() as IBibleVerse | null

      if (!row) {
        return Embed.json({
          color: colors.error,
          description: 'No verse found.'
        })
      }

      const embed = Embed.json({
        color: colors.ok,
        title: `${bookAcronym.shift()} ${chapter}:${verse}`,
        description: row.content
      })

      return embed
    }
  }
}
