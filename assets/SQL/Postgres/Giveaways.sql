CREATE TABLE IF NOT EXISTS kbGiveaways (
    id SERIAL PRIMARY KEY,
    guildId TEXT NOT NULL,
    messageId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    initiator TEXT NOT NULL,
    endDate TIMESTAMP NOT NULL,
    prize TEXT DEFAULT 'Nothing',
    winners SMALLINT DEFAULT 1
);