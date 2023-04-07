CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS kbPocket (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    request_token TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,

    CONSTRAINT user_id_name UNIQUE (user_id, username)
);

CREATE TABLE IF NOT EXISTS "kbReminders" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "once" BOOLEAN NOT NULL,
    "interval" INTERVAL DEFAULT NULL,
    "didEnd" BOOLEAN DEFAULT FALSE
);
