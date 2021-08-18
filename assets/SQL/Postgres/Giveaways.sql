CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS kbGiveaways (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    guildId TEXT NOT NULL,
    messageId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    initiator TEXT NOT NULL,
    endDate TIMESTAMP NOT NULL,
    prize TEXT DEFAULT 'Nothing',
    winners SMALLINT DEFAULT 1
);