import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const consonants = [
  'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N',
  'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'
]
const vowels = ['A', 'E', 'I', 'O', 'U']

const splitWord = (word: string): { an: string[], p: string[] } => {
  const punc = {
    // alphanumeric
    an: [] as string[],
    // punctuation
    p: [] as string[]
  }

  for (const letter of word) {
    const upper = letter.toUpperCase()
    if (consonants.includes(upper) || vowels.includes(upper) || !Number.isNaN(Number(upper))) {
      punc.an.push(letter)
    } else {
      punc.p.push(letter)
    }
  }

  return punc
}

const toPigLatin = (sentence: string): string => {
  const words = sentence.split(/\s+/g)
  const pigLatin = []

  for (const word of words) {
    const start = word.charAt(0).toUpperCase()
    if (consonants.includes(start)) {
      if (word.length > 1 && consonants.includes(word.charAt(1).toUpperCase())) {
        // When words begin with consonant clusters (multiple consonants that form one sound),
        // the whole sound is added to the end when speaking or writing
        let consonantsStart = 0
        for (const letter of word.toUpperCase()) {
          if (consonants.includes(letter)) {
            consonantsStart++
          } else {
            break
          }
        }

        const front = splitWord(word.slice(consonantsStart))
        const back = splitWord(word.slice(0, consonantsStart))
        pigLatin.push(`${front.an.join('')}${back.an.join('')}ay${front.p.join('')}${back.p.join('')}`)
        // pigLatin.push(`${word.slice(consonantsStart)}${word.slice(0, consonantsStart)}ay`);
      } else {
        // For words that begin with consonant sounds, all letters before the initial
        // vowel are placed at the end of the word sequence. Then, "ay" is added
        const { an, p } = splitWord(word)
        pigLatin.push(`${an.slice(1).join('')}${an[0]}ay${p.join('')}`)
      }
    } else if (vowels.includes(start)) {
      // For words that begin with vowel sounds, the vowel is left alone, and most commonly 'yay' is added to the end.
      const { an, p } = splitWord(word)
      pigLatin.push(`${an.join('')}yay${p.join('')}`)
    } else {
      // symbols, etc.
      pigLatin.push(word)
    }
  }

  return pigLatin.join(' ')
}

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Convert English to Pig Latin!',
        'To make pure ice, you freeze water. Oak is strong and also gives shade.'
      ],
      {
        name: 'piglatin',
        folder: 'Fun',
        args: [1],
        ratelimit: 3
      }
    )
  }

  init (_message: Message, { content }: Arguments): APIEmbed {
    const pig = toPigLatin(content)
    return Embed.ok(pig.slice(0, maxDescriptionLength))
  }
}
