# Khafra-Bot
A Discord bot with a lot of commands.

# Setup
1. Install dependencies using ``npm i``.
2. Create a ``.env`` file in the root directory and fill in the required values.
```
TOKEN=[Discord Token]
SPOTIFY_ID=[Spotify App ID]
SPOTIFY_SECRET=[Spotify Secret]
PROXY_USERNAME=[Proxy username]
PROXY_PASSWORD=[Proxy password]
POCKET_CONSUMER_KEY=[Pocket API Key]
NYTIMES=[NYTimes API Key]
HERE_WEATHER=[Weather API]
```
If you don't want a certain module, errors should be handled if no API key/credentials are used. The only required entry is the bot's token.

3. Build the bot
* Dev: ``npm run dev:build`` which will delete any old files and re-transpile it. Doing this will purge any GuildSettings.
* Prod: ``npm run prod:build`` which transpiles the code, overwriting old files, but does not delete any