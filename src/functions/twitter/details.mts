// Copyright (C) 2019 Zed <zedeus@pm.me>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { auth, routes, tweetFeatures } from '#khaf/functions/twitter/constants.mjs'
import { Token } from '#khaf/functions/twitter/token.mjs'
import { stringify } from 'node:querystring'
import { fetch } from 'undici'

export class Twitter {
  #guestToken!: Token

  getDetailsVariables (id: string): string {
    return JSON.stringify({
      focalTweetId: id,
      includePromotedContent: false,
      withBirdwatchNotes: false,
      withDownvotePerspective: false,
      withReactionsMetadata: false,
      withReactionsPerspective: false,
      withSuperFollowsTweetFields: false,
      withSuperFollowsUserFields: false,
      withVoice: false,
      withV2Timeline: true
    })
  }

  async getGraphTweet (id: string): Promise<string[] | null> {
    this.#guestToken ??= new Token()
    const token = await this.#guestToken.token

    if (token === null) {
      return null
    }

    const url = new URL(routes.graphTweet)
    url.search = stringify({
      variables: this.getDetailsVariables(id),
      features: tweetFeatures
    })

    // Note: undici.request does not work in this case.
    const result = await fetch(url, {
      headers: {
        authorization: auth,
        authority: 'api.twitter.com',
        'content-type': 'application/json',
        'x-twitter-active-user': 'yes',
        'accept-encoding': 'gzip',
        'accept-language': 'en-US,en;q=0.9',
        'accept': '*/*',
        'x-guest-token': token
      }
    })

    // The result might not be entirely correct, but is much better than using `any`.
    const json = await result.json() as typeof import('../../../assets/tweet.json')
    const { entries } = json.data.threaded_conversation_with_injections_v2.instructions[0]

    if (!entries) {
      return null
    }

    const links: string[] = []

    for (const entry of entries) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const media = entry.content.itemContent?.tweet_results?.result?.legacy?.extended_entities?.media

      if (typeof media === 'undefined') {
        continue // no media in tweet
      }

      for (const item of media) {
        if (item.type === 'animated_gif' || item.type === 'video') {
          const mp4 = item.video_info.variants.find(
            (v) => v.content_type === 'video/mp4'
          ) ?? item.video_info.variants[0]

          links.push(mp4.url)
        } else {
          links.push(item.media_url_https)
        }
      }
    }

    return links
  }
}
