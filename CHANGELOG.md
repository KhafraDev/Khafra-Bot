# v1.0.0
* Initial Release
* Guild settings in progress.
* Few commands.
* Bot structure is relatively close to finished.
* Prefix support.

# v1.0.0~beta1
* Added custom reacts to GuildSettings.
* Embeds are derived from common characteristics.
* Build scripts are now available for ease of access.
* Intelligently caches GuildSettings.
* Lots of logic and parsing errors were fixed.

# v1.0.0~beta2
* Cleanup on some commands and functions.
* GuildSettings: react to a message for a role. New message, old message, guild emoji, unicode emoji. Tweak this setting to your liking.
* Include typings for twemoji-parser.
* Remove inferred return types, add in other types.

# v1.0.0~beta3
* Ban now accepts a mention or a user's ID.
* Fixed a few permission issues.
* Better way of getting a user's avatar.
* Default permissions for commands are automatically added.
* GuildSettings: react roles are now stable, and many issues have been resolved.

# v1.0.0~beta4
* Split events into separate files.
* Add in a cooldown for commands.
* Removing a reaction from a react role will now remove the role.
* ``loadCommands`` now works on nested directories and no longer requires arguments.
* ``Sanitize`` has been removed from the ``Command`` class.
* Token is loaded from environment variables instead of ``KhafraClient``.
* Add ``mdn`` command for searching Mozilla Development Network easily.
* Add ``npm`` command for searching npmjs.com.
* Functional date formatter without external dependencies.

# v1.0.0~beta5
* Add in Spotify command.
* Use ``node-fetch`` for http requests. 
* Remove as many ``any`` types as possible.
* Separate types/interfaces in a separate folder.
* Fix a missing permissions bug in both messageReactionAdd and messageReactionRemove events.
* Fixed randomreacts not working.
* Remove member from random reacts.
* Remove a role react.

# v1.0.0~beta6
* Spotify command now defaults to the current song playing if no query is provided.
* Add in a ``role`` command, similar to user/server/channel lookup.
* Remove ``formatEmbed`` method from all commands that implemented it.
* Add in ``cowsay`` command with Tux and head-in options.
* Add in ``poll`` command to create polls.
* Add in ``discrim`` command to find users with a given discriminator.
* Only fetch columns needed from the database when fetching guild settings.
* Compile TypeScript to ESNext instead of ES6.
* Add in ``tictactoe`` command. For now you can only play against the bot.
* Add in ``help`` command for a description and example(s) of usage.
* Add in ``meepcraft`` command to get the number of players on MeepCraft. Routes request through a proxy.

# v1.0.0~beta7
* Add in ability to ``blacklist`` commands for a user, channel, or entirety of the guild.
* Add in ability to ``whitelist`` commands for a user or channel.
* Add in different ``cowsay`` types.
* Add in ``pocket`` commands which is a partial wrapper for the GetPocket.com API.
* MongoDB handles Pocket command(s). SQLite3 still handles guildsettings.
* Add in ``tags`` command. Small snippets of text that can be returned at any given point.
* Remove useless permission checks in commands.
* ``meepcraft`` command caches latest results for 5 minutes.
* ``tictactoe`` command will intelligently pick spots now.
* ``tictactoe`` will no longer freeze if it's a draw.
* Fixed issue where bot would give cooldowns if a valid command used a different prefix. For example: `+help` would issue a cooldown on the `help` command if the prefix was `!`.

# v1.0.0~beta8
* Added ``pocketadd`` to add articles, videos, or images to your Pocket list!
* ``pocketinit`` is now faster.
* Rename .i.ts files to .d.ts so they aren't transpiled.
* ``messagereact`` is now split into two commands: ``messagereact`` and ``messagereactmessage``. This fixes an issue where a message ID could never be fetched, unless it was in the current channel. GuildSettings will no longer store message content either, as it was unused. 
* On ``messageReactionAdd`` events, if the user isn't manageable by the client, it will (attempt) to DM the user to explain the issue and how to correct it.
* Commands that use the date formatter will now show the timezone (in GMT) and are in 12-hour times rather than 24-hours.
* Fixed a logic error in the ``ban`` command that would incorrectly check which member was bannable.
* Incorrect time inputs in ``ban`` will no longer throw an error.
* Cooldown messages will now tell the user the remaining time until they can use the command again.
* ``list`` command now sorts by category, making it much better.
* Add in ``insights``, which are similar to Discord's insights.
* Replace global ``isNaN`` with ``Number.isNaN``.
* Add in ``trivia``, ``triviahelp``, and ``trivialist`` commands.