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

import { auth, routes, tweetFeatures } from '#khaf/functions/twitter/constants.js'
import { Token } from '#khaf/functions/twitter/token.js'
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

    /* eslint-disable */
    const json = await result.json() as any
    const media: string[] | undefined = json
      .data
      ?.threaded_conversation_with_injections_v2 // error (guest token, etc.)
      .instructions[0]
      .entries[0]
      .content
      .itemContent
      .tweet_results
      .result
      .legacy
      .extended_entities
      ?.media // no media in tweet
      .map((media: any) => media.type !== 'animated_gif'
        ? media.media_url_https
        : media.video_info.variants[0].url
      )
    /* eslint-enable */

    return media ?? null
  }
}
