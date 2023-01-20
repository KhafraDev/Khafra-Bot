import { once } from '#khaf/utility/Memoize.js'
import { request } from 'undici'

interface EmojiLine {
  codePoints: string
  identifier: string
  comment: string
  isSub: undefined
  group: undefined
}

interface GroupOrSubgroup {
  codePoints: undefined
  identifier: undefined
  comment: undefined
  isSub: string
  group: string
}

type Matches<T extends string> = T extends `${infer _}?<${infer U}>${infer Rest}`
  ? U | Matches<Rest>
  : never

type RecordFromMatch<T extends string> = {
  [Key in Matches<T>]: string | undefined
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const typedRegexMatchAll = <
  T extends string
>(pattern: T, flags?: string) => {
  const regex = new RegExp(pattern, flags)

  return <R extends RecordFromMatch<T>>(match: string): IterableIterator<
    RegExpMatchArray & { groups: R }
  > => {
    return match.matchAll(regex) as IterableIterator<RegExpMatchArray & { groups: R }>
  }
}

// # (sub)group: face-neutral-skeptical
//	   ^	^--- is group   ^
//	   └-- is sub group     └-- group name
// 1F910                                                  ; fully-qualified     # 🤐 E1.0 zipper-mouth face
//   ^ codepoint(s)                                              ^ identifier                ^ comment
const matchFn = typedRegexMatchAll(
  '^((?<codePoints>.*?)\\s+; (?<identifier>[a-z-]+)\\s+# (?<comment>(.*?))|# (?<isSub>sub)?group: (?<group>(.*?)))$',
  'gm'
)

export const parseEmojiList = once(async () => {
  const cache = new Map<string, { [key in keyof EmojiLine]: string }>()
  const { body } = await request('https://unicode.org/Public/emoji/15.0/emoji-test.txt')
  const fullList = await body.text()

  let group = '', subgroup = ''

  for (const item of matchFn<EmojiLine | GroupOrSubgroup>(fullList)) {
    const {
      group: newGroup,
      isSub,
      codePoints,
      identifier,
      comment
    } = item.groups

    if (newGroup !== undefined) {
      if (isSub === 'sub') {
        subgroup = newGroup
      } else {
        group = newGroup
      }

      continue
    }

    cache.set(codePoints, { group, isSub: subgroup, codePoints, identifier, comment })
  }

  return cache
})
