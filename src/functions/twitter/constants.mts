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

export const auth = // eslint-disable-next-line max-len
  'Bearer AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw'

export const tweetFeatures = JSON.stringify({
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: false,
  standardized_nudges_misinfo: false,
  verified_phone_label_enabled: false,
  responsive_web_twitter_blue_verified_badge_is_enabled: false,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
  view_counts_everywhere_api_enabled: false,
  responsive_web_edit_tweet_api_enabled: false,
  tweetypie_unmention_optimization_enabled: false,
  vibe_api_enabled: false,
  longform_notetweets_consumption_enabled: false,
  responsive_web_text_conversations_enabled: false,
  responsive_web_enhance_cards_enabled: false,
  interactive_text_enabled: false
})

export const routes = {
  activate: 'https://api.twitter.com/1.1/guest/activate.json',
  graphTweet: 'https://api.twitter.com/graphql/6lWNh96EXDJCXl05SAtn_g/TweetDetail'
}
