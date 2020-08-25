# Khafra-Bot
A Discord bot with a lot of commands.

# Commercial
* Khafra-Bot does not sell access to any content or features.

# Setup
1. Install dependencies using ``npm i``.
2. Create a ``.env`` file in the root directory and fill in the required values.
```
DB_USER=[OPTIONAL]
DB_PASSWORD=[OPTIONAL]
TOKEN=[Discord Token]
SPOTIFY_ID=[Spotify App ID]
SPOTIFY_SECRET=[Spotify Secret]
PROXY_USERNAME=[Proxy username]
PROXY_PASSWORD=[Proxy password]
POCKET_CONSUMER_KEY=[Pocket API Key]
NYTIMES=[NYTimes API Key]
HERE_WEATHER=[Weather API]
THEGUARDIAN=[TheGuardian API Key]
GOOGLE_API=[Google API Key]
```
If you don't want a certain module, errors should be handled if no API key/credentials are used. The only required entry is the bot's token.

3. Install Python 3 (tested on 3.8.2).
4. Install Python requirements with `pip install -r requirements.txt`
5. Build the bot
* Dev: ``npm run dev:build`` which will delete any old files and re-transpile it.
* Prod: ``npm run prod:build`` which transpiles the code, overwriting old files, but does not delete any.