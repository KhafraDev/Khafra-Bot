# Khafra-Bot
A Discord bot with a lot of commands.

# Commercial
* Khafra-Bot does not sell access to any content or features.

# Privacy
```md
When using Khafra-Bot some information about you and the command used will be temporarily stored. The purpose of these logs is to provide debug info if errors or misuse occur. A complete log entry looks like:

``[08-26-2020 09:42:09PM] Message: "Command: minesweeper | Author: 267774648622645249 | URL: https://discord.com/channels/677271830838640680/733157666737881149/748356650515300394 | Guild: 677271830838640680 | Input: !minesweeper"``

These logs are temporary and only stored when using the bot (whether that is reacting for a role or using a command).
Read through the terms of service for bot developers at https://discord.com/developers/docs/legal (collecting logs falls under section 2-A).

Taken from [here](https://discord.com/channels/677271830838640680/705894525473784303/748361427328303175)
```

# Setup
1. Install dependencies using ``npm i``.
2. Install pm2 globally using ``npm i -g pm2``.
3. Create a ``.env`` file in the root directory and fill in the required values.
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

4. Install Python 3 (tested on 3.8.2).
5. Install Python requirements with `[sudo] pip[3] install -r requirements.txt`
6. Edit the [config](./config.json) file.
* For multiple bot owners, an array can be used, or a single string.
7. Run the bot
* Dev: ``npm run dev:build`` which will delete any old files and re-transpile it.
* Prod: ``npm run prod:build`` which transpiles the code, overwriting old files, but does not delete any.